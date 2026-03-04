import React, { useEffect, useState } from 'react';
import { Button, Card, message } from 'antd'; // Import Ant Design's Card component
import { useNavigate } from 'react-router-dom';
import './App.css';
import { ensureDefaultQuestionsImported, getCategories } from './questionsApi';
import CatSpinner from './CatSpinner';

const CATEGORY_ORDER = ['facile', 'medio', 'difficile'];
const formatCategoryName = (name) => name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : name;
const FEEDBACK_IMAGES = ['gatto.jpeg', 'gattotriste.jpeg'];

const preloadImage = (src) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => resolve(true);
  image.onerror = () => resolve(false);
  image.src = src;
});

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]); // State to store categories
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        await ensureDefaultQuestionsImported();
        const categoryRows = await getCategories();
        const orderedRows = [...categoryRows].sort((left, right) => {
          const leftIndex = CATEGORY_ORDER.indexOf(left.name.toLowerCase());
          const rightIndex = CATEGORY_ORDER.indexOf(right.name.toLowerCase());

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

        await Promise.all(
          FEEDBACK_IMAGES.map((fileName) => preloadImage(`${process.env.PUBLIC_URL}/${fileName}`))
        );

        setCategories(categoryArray);
      } catch (error) {
        console.error('Error loading categories:', error);
        message.error('Impossibile caricare le categorie da Supabase.');
      } finally {
        setIsLoadingCategories(false);
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
        {isLoadingCategories ? (
          <div style={{ minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <CatSpinner size={110} />
          </div>
        ) : (
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
                <h2>{formatCategoryName(category.name)}</h2>
              </Card>
            ))}
          </div>
        )}
        <Button  type="primary" onClick={handleClick}>Indietro</Button>
      </header>
    </div>
  );
}

export default Home;
