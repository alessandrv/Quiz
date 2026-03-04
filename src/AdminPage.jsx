import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, message, Modal } from 'antd';

function AdminPage() {
  const [questions, setQuestions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // Track the current question being edited
  const [form] = Form.useForm();

  useEffect(() => {
    // Load questions from the Electron API (questions.json)
    window.electronAPI.getQuestions().then((data) => {
      setQuestions(data);
    }).catch((error) => {
      console.error('Error fetching questions:', error);
      message.error('Failed to load questions.');
    });
  }, []);

  const showModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      form.setFieldsValue(question);
    } else {
      form.resetFields();
      setEditingQuestion(null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleDelete = (questionToDelete) => {
    const updatedQuestions = questions.filter(
      (question) => question.question !== questionToDelete.question
    );
    updateQuestions(updatedQuestions);
  };

  const handleSave = (values) => {
    let updatedQuestions;

    if (editingQuestion) {
      updatedQuestions = questions.map((question) =>
        question.question === editingQuestion.question ? values : question
      );
    } else {
      updatedQuestions = [...questions, values];
    }

    updateQuestions(updatedQuestions);
  };

  const updateQuestions = (updatedQuestions) => {
    window.electronAPI.saveQuestions(updatedQuestions)
      .then(() => {
        setQuestions(updatedQuestions);
        message.success('Questions updated successfully');
        setIsModalVisible(false);
      })
      .catch((error) => {
        console.error('Error updating questions:', error);
        message.error('Failed to update questions.');
      });
  };

  return (
    <div style={styles.pageContainer}>
      <Button type="primary" onClick={() => showModal()}>
        Add New Question
      </Button>

      <div style={styles.questionsList}>
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <Card key={index} style={styles.card}>
              <h3>{question.question}</h3>
              <p>A: {question.A}</p>
              <p>B: {question.B}</p>
              <p>C: {question.C}</p>
              <p>D: {question.D}</p>
              <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>

              <Button type="link" onClick={() => showModal(question)}>
                Edit
              </Button>
              <Button type="link" danger onClick={() => handleDelete(question)}>
                Delete
              </Button>
            </Card>
          ))
        ) : (
          <p>No questions available</p>
        )}
      </div>

      <Modal
        title={editingQuestion ? 'Edit Question' : 'Add New Question'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSave}>
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: 'Please enter the question' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="A" label="Option A" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="B" label="Option B" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="C" label="Option C" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="D" label="Option D" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="correctAnswer"
            label="Correct Answer"
            rules={[{ required: true, message: 'Please enter the correct answer' }]}
          >
            <Input />
          </Form.Item>

          <Button type="primary" htmlType="submit" style={{ marginTop: '10px' }}>
            {editingQuestion ? 'Update' : 'Add'} Question
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

const styles = {
  pageContainer: {
    padding: '20px',
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
  },
  questionsList: {
    marginTop: '20px',
  },
  card: {
    marginBottom: '20px',
  },
};

export default AdminPage;
