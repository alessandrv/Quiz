import { supabase } from './supabaseClient';

const BUCKET = 'question-images';

const normalizeImportedImagePath = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  if (image.startsWith('./')) return image.replace('./', '/');
  return image;
};

const mapDbQuestionToUi = (row) => ({
  id: row.id,
  question: row.question,
  A: row.option_a,
  B: row.option_b,
  C: row.option_c,
  D: row.option_d,
  correctAnswer: row.correct_answer,
  spiegazione: row.explanation,
  image: row.image_path,
  created_at: row.created_at,
});

const mapUiQuestionToDb = (question, categoryId) => ({
  category_id: categoryId,
  question: question.question,
  option_a: question.A,
  option_b: question.B,
  option_c: question.C,
  option_d: question.D,
  correct_answer: question.correctAnswer,
  explanation: question.spiegazione || null,
  image_path: question.image || null,
});

export const ensureDefaultQuestionsImported = async () => {
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw countError;
  }

  if (count && count > 0) {
    return false;
  }

  const response = await fetch(`${process.env.PUBLIC_URL}/questions.json`);
  if (!response.ok) {
    throw new Error('Unable to load default questions.json');
  }
  const jsonData = await response.json();

  const categoryNames = Object.keys(jsonData);
  if (!categoryNames.length) {
    return false;
  }

  const categoryRows = categoryNames.map((name) => ({ name }));
  const { error: categoryInsertError } = await supabase
    .from('categories')
    .upsert(categoryRows, { onConflict: 'name', ignoreDuplicates: true });

  if (categoryInsertError) {
    throw categoryInsertError;
  }

  const { data: categories, error: categoryReadError } = await supabase
    .from('categories')
    .select('id,name')
    .in('name', categoryNames);

  if (categoryReadError) {
    throw categoryReadError;
  }

  const categoryByName = categories.reduce((acc, row) => {
    acc[row.name] = row.id;
    return acc;
  }, {});

  const questionRows = [];
  categoryNames.forEach((categoryName) => {
    const categoryId = categoryByName[categoryName];
    const items = jsonData[categoryName] || [];

    items.forEach((item) => {
      if (!categoryId || !item.question) {
        return;
      }

      questionRows.push({
        category_id: categoryId,
        question: item.question,
        option_a: item.A || '',
        option_b: item.B || '',
        option_c: item.C || '',
        option_d: item.D || '',
        correct_answer: item.correctAnswer || 'A',
        explanation: item.spiegazione || null,
        image_path: normalizeImportedImagePath(item.image),
      });
    });
  });

  if (!questionRows.length) {
    return false;
  }

  const chunkSize = 200;
  for (let index = 0; index < questionRows.length; index += chunkSize) {
    const chunk = questionRows.slice(index, index + chunkSize);
    const { error: chunkError } = await supabase
      .from('questions')
      .upsert(chunk, { onConflict: 'category_id,question', ignoreDuplicates: true });

    if (chunkError) {
      throw chunkError;
    }
  }

  return true;
};

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id,name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

export const getQuestionsByCategoryName = async (categoryName) => {
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id,name')
    .eq('name', categoryName)
    .single();

  if (categoryError) {
    throw categoryError;
  }

  let query = supabase
    .from('questions')
    .select('id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,image_path,created_at')
    .eq('category_id', category.id)
    .order('created_at', { ascending: true });

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []).map(mapDbQuestionToUi);
};

export const getGroupedQuestions = async () => {
  const [categories, questions] = await Promise.all([
    getCategories(),
    supabase
      .from('questions')
      .select('id,category_id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,image_path,created_at')
      .order('created_at', { ascending: true }),
  ]);

  const { data: questionRows, error } = questions;
  if (error) {
    throw error;
  }

  const grouped = {};
  categories.forEach((category) => {
    grouped[category.name] = [];
  });

  (questionRows || []).forEach((row) => {
    const category = categories.find((item) => item.id === row.category_id);
    if (!category) {
      return;
    }
    grouped[category.name].push(mapDbQuestionToUi(row));
  });

  return grouped;
};

export const createCategory = async (name) => {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select('id,name')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteCategoryByName = async (name) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('name', name);

  if (error) {
    throw error;
  }
};

export const upsertQuestion = async ({ categoryName, question }) => {
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id,name')
    .eq('name', categoryName)
    .single();

  if (categoryError) {
    throw categoryError;
  }

  const payload = mapUiQuestionToDb(question, category.id);
  let request;

  if (question.id) {
    request = supabase
      .from('questions')
      .update(payload)
      .eq('id', question.id)
      .select('id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,image_path,created_at')
      .single();
  } else {
    request = supabase
      .from('questions')
      .insert(payload)
      .select('id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,image_path,created_at')
      .single();
  }

  const { data, error } = await request;
  if (error) {
    throw error;
  }

  return mapDbQuestionToUi(data);
};

export const deleteQuestionById = async (questionId) => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    throw error;
  }
};

export const uploadQuestionImage = async (file) => {
  const extension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
};
