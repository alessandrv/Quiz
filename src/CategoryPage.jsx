import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, message, Modal, Button, Spin } from 'antd';
import TimerComponent from './AnalogTimer';
import { ensureDefaultQuestionsImported, getQuestionsByCategoryName } from './questionsApi';

function CategoryPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [askedQuestionIds, setAskedQuestionIds] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [disabledCards, setDisabledCards] = useState([]);
  const [timerKey, setTimerKey] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [spiegazione, setSpiegazione] = useState('');
  const handleClick = () => {
    navigate(`/home`);
  };

  const pickRandomQuestion = (questions, askedIds = []) => {
    if (!questions.length) {
      return null;
    }

    const candidateQuestions = questions.filter((question) => !askedIds.includes(question.id));

    if (!candidateQuestions.length) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidateQuestions.length);
    return candidateQuestions[randomIndex];
  };

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        await ensureDefaultQuestionsImported();
        const categoryQuestions = await getQuestionsByCategoryName(name);
        setTotalQuestions(categoryQuestions.length);

        const questionIds = new Set(categoryQuestions.map((question) => question.id));
        const savedAskedIds = JSON.parse(localStorage.getItem(`asked:${name}`)) || [];
        const validAskedIds = savedAskedIds.filter((id) => questionIds.has(id));

        let cycleAskedIds = validAskedIds;

        if (categoryQuestions.length > 0 && validAskedIds.length >= categoryQuestions.length) {
          cycleAskedIds = [];
          localStorage.setItem(`asked:${name}`, JSON.stringify([]));
        }

        setAskedQuestionIds(cycleAskedIds);
        const nextQuestion = pickRandomQuestion(categoryQuestions, cycleAskedIds);
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setAnswerFeedback(null);
        setIsAnswered(false);
        setDisabledCards([]);
        setTimerKey((prevKey) => prevKey + 1);
      } catch (error) {
        console.error('Error loading questions:', error);
        message.error('Impossibile caricare le domande da Supabase.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [name]);

  const handleTimerComplete = () => {
    message.info('Tempo scaduto!');
  };

  const handleAnswerClick = (answer) => {
    if (answer === currentQuestion.correctAnswer) {
      setIsAnswered(true);
      setAnswerFeedback('correct');
      message.success('Risposta corretta!');

      if (currentQuestion?.id && !askedQuestionIds.includes(currentQuestion.id)) {
        const nextAskedIds = [...askedQuestionIds, currentQuestion.id];

        if (totalQuestions > 0 && nextAskedIds.length >= totalQuestions) {
          setAskedQuestionIds([]);
          localStorage.setItem(`asked:${name}`, JSON.stringify([]));
        } else {
          setAskedQuestionIds(nextAskedIds);
          localStorage.setItem(`asked:${name}`, JSON.stringify(nextAskedIds));
        }
      }

      // If the question has a "spiegazione" field, show the modal
      if (currentQuestion.spiegazione) {
        setSpiegazione(currentQuestion.spiegazione);  // Set the explanation text
        setIsModalVisible(true);  // Show the modal
      }

      // Redirect to home if no modal is present
      if (!currentQuestion.spiegazione) {
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      }
    } else {
      setAnswerFeedback('incorrect');
      message.error('Risposta sbagliata!');
      setDisabledCards(prevState => [...prevState, answer]);
    }

    setSelectedAnswer(answer);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);  // Close the modal
    navigate('/home');  };

  return (
    <div style={styles.pageContainer}>
      {!isLoading && currentQuestion && (
        <TimerComponent
          key={timerKey}
          totalSeconds={60}
          onComplete={handleTimerComplete}
        />
      )}

      {isLoading ? (
        <div style={styles.loadingContainer}>
          <Spin size="large" />
        </div>
      ) : currentQuestion ? (
        <div style={styles.contentContainer}>
          {currentQuestion.image && (
            <img
              src={currentQuestion.image}
              alt="Illustrazione della domanda"
              style={styles.image}
            />
          )}

          <h2 style={styles.question}>{currentQuestion.question}</h2>
          <div style={styles.cardsContainer}>
            {['A', 'B', 'C', 'D'].map((option, index) => (
              <Card
                key={index}
                onClick={() => !isAnswered && !disabledCards.includes(option) && handleAnswerClick(option)}
                hoverable={!isAnswered && !disabledCards.includes(option)}
                style={{
                  ...styles.card,
                  backgroundColor: disabledCards.includes(option)
                    ? '#ff4d4f'
                    : selectedAnswer === option && answerFeedback === 'correct'
                    ? '#52c41a'
                    : '#fff',
                  color: disabledCards.includes(option) || (selectedAnswer === option && answerFeedback === 'correct')
                    ? '#fff'
                    : '#000',
                  opacity: disabledCards.includes(option) ? 0.5 : 1,
                  pointerEvents: disabledCards.includes(option) ? 'none' : 'auto'
                }}
              >
                <strong>{option}. </strong>{currentQuestion[option]}
              </Card>
            ))}
          </div>
          <Button style={{marginTop:'20px'}} type="primary" onClick={handleClick}>Indietro</Button>

        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column'}}>
         <h2 style={styles.question}>Domande esaurite</h2>
         <Button  type="primary" onClick={handleClick}>Indietro</Button>
        </div>
       

      )}

      {/* Modal for explanation */}
      <Modal
        title="Spiegazione"
        visible={isModalVisible}
        onOk={handleModalClose}
        okText="Continua"
        onCancel={handleModalClose}
      >
        <p>{spiegazione}</p>
      </Modal>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#282c34',
    padding: '0 20px',
  },
  contentContainer: {
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '220px',
    width: '100%',
  },
  question: {
    color: '#fff',
    marginBottom: '20px',
    fontSize: '24px',
  },
  image: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    marginBottom: '20px',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '20px',
  },
  card: {
    width: '100%',
    textAlign: 'center',
    fontSize: '18px',
    padding: '20px',
  },
};

export default CategoryPage;
