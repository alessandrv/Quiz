import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, message, Button, Spin } from 'antd';
import TimerComponent from './AnalogTimer';
import { ensureDefaultQuestionsImported, getQuestionsByCategoryName } from './questionsApi';

function CategoryPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [askedQuestionIds, setAskedQuestionIds] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [resultImage, setResultImage] = useState(null);
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
        setIsAnswered(false);
        setSelectedAnswer(null);
        setAnswerFeedback(null);
        setResultImage(null);
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
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setIsAnswered(true);
      setSelectedAnswer(answer);
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
      setResultImage(`${process.env.PUBLIC_URL}/gatto.jpeg`);
      setTimeout(() => {
        navigate('/home');
      }, 4000);
    } else {
      message.error('Risposta sbagliata!');
      setResultImage(`${process.env.PUBLIC_URL}/gattotriste.jpeg`);
      setTimeout(() => {
        setResultImage(null);
        setIsAnswered(true);
        setSelectedAnswer(answer);
        setAnswerFeedback('incorrect');
      }, 4000);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {resultImage ? (
        <div style={styles.feedbackContainer}>
          <img src={resultImage} alt="Feedback risultato" style={styles.feedbackImage} />
        </div>
      ) : null}

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
      ) : resultImage ? null : currentQuestion ? (
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
            {['A', 'B', 'C', 'D', 'E'].map((option, index) => (
              <Card
                key={index}
                onClick={() => !isAnswered && handleAnswerClick(option)}
                hoverable={!isAnswered}
                style={{
                  ...styles.card,
                  ...(option === 'E' ? styles.centerLastOption : {}),
                  backgroundColor: selectedAnswer === option && answerFeedback === 'incorrect' ? '#ff4d4f' : '#fff',
                  color: selectedAnswer === option && answerFeedback === 'incorrect' ? '#fff' : '#000',
                  opacity: selectedAnswer === option && answerFeedback === 'incorrect' ? 0.7 : 1,
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
    position: 'relative',
    zIndex: 1,
  },
  feedbackContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackImage: {
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
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
  centerLastOption: {
    gridColumn: '1 / span 2',
    justifySelf: 'center',
    width: 'calc(50% - 10px)',
  },
};

export default CategoryPage;
