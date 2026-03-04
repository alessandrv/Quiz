import React, { useState, useEffect, useRef } from 'react';
import { Button, Table, Modal, Input, Select, Form, message, Popconfirm } from 'antd';
import { FileAddOutlined, DeleteOutlined, ArrowLeftOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import './App.css';
import { useNavigate } from 'react-router-dom';
import {
  ensureDefaultQuestionsImported,
  getGroupedQuestions,
  upsertQuestion,
  deleteQuestionById,
  createCategory,
  deleteCategoryByName,
  uploadQuestionImage,
} from './questionsApi';

const { Option } = Select;

function QuestionManager() {
  const navigate = useNavigate();
  const [questionsData, setQuestionsData] = useState({});
  const [currentCategory, setCurrentCategory] = useState('');
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState('Seleziona Immagine');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef(null);
  const [form] = Form.useForm();

  const refreshQuestions = async (ensureImport = false) => {
    setIsLoading(true);
    try {
      if (ensureImport) {
        await ensureDefaultQuestionsImported();
      }
      const grouped = await getGroupedQuestions();
      setQuestionsData(grouped);

      const categoryNames = Object.keys(grouped);
      if (!categoryNames.length) {
        setCurrentCategory('');
      } else if (!categoryNames.includes(currentCategory)) {
        setCurrentCategory(categoryNames[0]);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle domande:', error);
      message.error('Errore nel caricamento delle domande da Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshQuestions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCategoryChange = (value) => {
    setCurrentCategory(value);
    setEditedQuestion(null);
  };

  const handleEdit = (record) => {
    setEditedQuestion(record);
    form.setFieldsValue(record);
    setSelectedImageName(record.image ? 'Immagine presente' : 'Seleziona Immagine');
    setModalVisible(true);
  };

  const handleSaveQuestion = async (values) => {
    if (!currentCategory) {
      message.error('Seleziona una categoria.');
      return;
    }

    setIsLoading(true);
    try {
      await upsertQuestion({
        categoryName: currentCategory,
        question: {
          ...values,
          id: editedQuestion?.id,
        },
      });

      message.success(editedQuestion ? 'Domanda aggiornata!' : 'Domanda aggiunta!');
      setEditedQuestion(null);
      setModalVisible(false);
      form.resetFields();
      setSelectedImageName('Seleziona Immagine');
      await refreshQuestions(false);
    } catch (error) {
      console.error('Errore nel salvataggio della domanda:', error);
      message.error('Errore nel salvataggio della domanda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!currentCategory) {
      message.error('Aggiungi prima una categoria.');
      return;
    }
    setEditedQuestion(null);
    form.resetFields();
    setSelectedImageName('Seleziona Immagine');
    setModalVisible(true);
  };

  const handleRemoveQuestion = async (questionId) => {
    setIsLoading(true);
    try {
      await deleteQuestionById(questionId);
      message.success('Domanda rimossa.');
      await refreshQuestions(false);
    } catch (error) {
      console.error('Errore nella rimozione della domanda:', error);
      message.error('Errore nella rimozione della domanda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    try {
      const publicUrl = await uploadQuestionImage(file);
      form.setFieldsValue({ image: publicUrl });
      setSelectedImageName(file.name);
      message.success('Immagine caricata con successo!');
    } catch (error) {
      console.error("Errore nell'upload immagine:", error);
      message.error("C'è stato un problema durante l'upload dell'immagine.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOpenImagePicker = () => {
    if (isUploadingImage || isLoading) {
      return;
    }
    imageInputRef.current?.click();
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      message.error('Il nome della categoria non può essere vuoto.');
      return;
    }

    if (Object.prototype.hasOwnProperty.call(questionsData, trimmed)) {
      message.error('La categoria esiste già.');
      return;
    }

    setIsLoading(true);
    try {
      await createCategory(trimmed);
      setCurrentCategory(trimmed);
      setIsCategoryModalVisible(false);
      setNewCategoryName('');
      message.success(`Categoria "${trimmed}" aggiunta!`);
      await refreshQuestions(false);
    } catch (error) {
      console.error('Errore aggiunta categoria:', error);
      message.error('Errore durante la creazione della categoria.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCategory = async () => {
    if (!currentCategory) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteCategoryByName(currentCategory);
      message.success(`Categoria "${currentCategory}" rimossa.`);
      await refreshQuestions(false);
    } catch (error) {
      console.error('Errore rimozione categoria:', error);
      message.error('Errore durante la rimozione della categoria.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDefaults = async () => {
    setIsLoading(true);
    try {
      const imported = await ensureDefaultQuestionsImported();
      await refreshQuestions(false);
      message.success(imported ? 'Domande predefinite importate.' : 'Domande già presenti nel database.');
    } catch (error) {
      console.error('Errore import default:', error);
      message.error('Errore durante import delle domande predefinite.');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      title: 'Domanda',
      dataIndex: 'question',
      key: 'question',
    },
    {
      title: 'Opzione A',
      dataIndex: 'A',
      key: 'A',
    },
    {
      title: 'Opzione B',
      dataIndex: 'B',
      key: 'B',
    },
    {
      title: 'Opzione C',
      dataIndex: 'C',
      key: 'C',
    },
    {
      title: 'Opzione D',
      dataIndex: 'D',
      key: 'D',
    },
    {
      title: 'Spiegazione',
      dataIndex: 'spiegazione',
      key: 'spiegazione',
    },
    {
      title: 'Azioni',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Modifica
          </Button>
          <Popconfirm
            title="Sei sicuro di voler eliminare questa domanda?"
            onConfirm={() => handleRemoveQuestion(record.id)}
            okText="Sì"
            cancelText="No"
          >
            <Button type="link" danger>
              Elimina
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="sfondo">
      <h1 style={{ marginLeft: '10px' }}>Gestione domande</h1>
      <Button type="default" onClick={() => navigate('/')} style={{ marginLeft: '10px', marginTop: '10px' }}>
        <ArrowLeftOutlined /> Indietro
      </Button>
      <Button type="primary" onClick={handleAddQuestion} style={{ marginTop: '10px', marginLeft: '10px' }} disabled={isLoading}>
        <FileAddOutlined /> Aggiungi Nuova Domanda
      </Button>
      <Button type="primary" onClick={() => setIsCategoryModalVisible(true)} style={{ marginLeft: '10px', marginTop: '10px' }} disabled={isLoading}>
        <FileAddOutlined /> Aggiungi Nuova Categoria
      </Button>
      <Button type="default" onClick={handleImportDefaults} style={{ marginLeft: '10px', marginTop: '10px' }} disabled={isLoading}>
        <ReloadOutlined /> Importa Domande Predefinite
      </Button>
      <Popconfirm
        title={`Sei sicuro di voler eliminare la categoria "${currentCategory}"?`}
        onConfirm={handleRemoveCategory}
        okText="Sì"
        cancelText="No"
      >
        <Button type="primary" danger style={{ marginLeft: '10px', marginTop: '10px' }} disabled={!currentCategory || isLoading}>
          <DeleteOutlined /> Rimuovi Categoria Attuale
        </Button>
      </Popconfirm>

      {Object.keys(questionsData).length > 0 ? (
        <>
          <Select
            style={{ width: 260, marginBottom: '10px', marginLeft: '10px', marginTop: '10px' }}
            value={currentCategory}
            onChange={handleCategoryChange}
            loading={isLoading}
          >
            {Object.keys(questionsData).map((category) => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>

          <Table
            loading={isLoading}
            dataSource={questionsData[currentCategory] || []}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        </>
      ) : (
        <p style={{ marginLeft: '10px' }}>Nessuna domanda disponibile. Importa il dataset predefinito o aggiungi nuove categorie.</p>
      )}

      <Modal
        title={editedQuestion ? 'Modifica Domanda' : 'Aggiungi Nuova Domanda'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ loading: isLoading }}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveQuestion}>
          <Form.Item name="question" label="Domanda" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="A" label="Opzione A" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="B" label="Opzione B" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="C" label="Opzione C" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="D" label="Opzione D" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="correctAnswer" label="Risposta Corretta" rules={[{ required: true }]}>
            <Select>
              <Option value="A">A</Option>
              <Option value="B">B</Option>
              <Option value="C">C</Option>
              <Option value="D">D</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Immagine">
            <Button
              icon={<UploadOutlined />}
              loading={isUploadingImage}
              disabled={isLoading}
              onClick={handleOpenImagePicker}
            >
              {selectedImageName}
            </Button>
            <input
              id="question-image-upload"
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
          </Form.Item>

          <Form.Item name="image" label="URL Immagine">
            <Input />
          </Form.Item>

          <Form.Item name="spiegazione" label="Spiegazione">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Aggiungi Nuova Categoria"
        open={isCategoryModalVisible}
        onCancel={() => setIsCategoryModalVisible(false)}
        onOk={handleAddCategory}
        okButtonProps={{ loading: isLoading }}
      >
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Inserisci il nome della nuova categoria"
        />
      </Modal>
    </div>
  );
}

export default QuestionManager;
