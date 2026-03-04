import React, { useEffect, useState } from 'react';
import { Button, Card, message } from 'antd'; // Import Ant Design's Card component
import { useNavigate } from 'react-router-dom';
import './App.css';
import { ensureDefaultQuestionsImported, getCategories } from './questionsApi';

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]); // State to store categories

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await ensureDefaultQuestionsImported();
        const categoryRows = await getCategories();
        const categoryArray = categoryRows.map((item, index) => ({
          name: item.name,
          color: `hsl(${(index * 480) / Math.max(categoryRows.length, 1)}, 70%, 50%)`,
        }));
        setCategories(categoryArray);
      } catch (error) {
        console.error('Error loading categories:', error);
        message.error('Impossibile caricare le categorie da Supabase.');
      }
    };

    loadCategories();
  }, []);

  // Function to handle card click and navigate to a new page
  const handleCardClick = (category) => {
    navigate(`/category/${category}`);
  };

  const handleClick = () => {
    navigate(`/`);
  };

  return (
    <div className="Home">
      <header className="App-header">
        <h1>Categorie</h1>
        {/* 2x2 Grid Layout for Category Cards */}
        <div className="category-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          {categories.map((category, index) => (
            <Card
              key={index}
              hoverable
              onClick={() => handleCardClick(category.name)}
              style={{
                width: '45%',
                marginBottom: '20px',
                backgroundColor: category.color,
                textAlign: 'center',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <h2>{category.name}</h2>
            </Card>
          ))}
        </div>
        <Button  type="primary" onClick={handleClick}>Indietro</Button>
      </header>
    </div>
  );
}

export default Home;
