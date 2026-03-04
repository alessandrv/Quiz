import React, { useEffect, useState } from 'react';
import { Button, Card, message } from 'antd'; // Import Ant Design's Card component
import { useNavigate } from 'react-router-dom';
import './App.css';
import { ensureDefaultQuestionsImported, getCategories } from './questionsApi';

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]); // State to store categories
  const preferredOrder = ['facile', 'medio', 'difficile'];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await ensureDefaultQuestionsImported();
        const categoryRows = await getCategories();
        const orderedRows = [...categoryRows].sort((left, right) => {
          const leftIndex = preferredOrder.indexOf(left.name.toLowerCase());
          const rightIndex = preferredOrder.indexOf(right.name.toLowerCase());

          if (leftIndex === -1 && rightIndex === -1) {
            return left.name.localeCompare(right.name);
          }
          if (leftIndex === -1) {
            return 1;
          }
          if (rightIndex === -1) {
            return -1;
          }
          return leftIndex - rightIndex;
        });

        const categoryArray = orderedRows.map((item, index) => ({
          name: item.name,
          color: `hsl(${(index * 480) / Math.max(orderedRows.length, 1)}, 70%, 50%)`,
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
        <div className="category-grid" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
          {categories.map((category, index) => (
            <Card
              key={index}
              hoverable
              onClick={() => handleCardClick(category.name)}
              style={{
                width: '33.33%',
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
