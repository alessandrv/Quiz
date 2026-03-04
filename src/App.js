import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, message, Space, Drawer } from 'antd';
import { useNavigate } from 'react-router-dom';
import { MenuOutlined } from '@ant-design/icons';

function App() {
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleCardClick = () => {
    navigate('home');
  };

  const handleReset = () => {
    localStorage.clear();
  
    message.info('Domande resettate');
  };
  

  const goToQuestionManager = () => {
    navigate('/manage-questions');
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <div className="App">
      <header style={{ display: 'flex' }} className="App-header">
        <h1 style={{ fontSize: '5rem' }}>Benvenuti al Chemical Pursuit</h1>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Button type="primary" onClick={handleCardClick}>
            Inizia
          </Button>

          {/* Button to toggle side menu */}
          <Button
            type="default"
            icon={<MenuOutlined />}
            style={{ marginTop: '20px' }}
            onClick={toggleDrawer}
          >
            Impostazioni
          </Button>
        </div>
      </header>

      {/* Side menu drawer */}
      <Drawer
        title="Impostazioni"
        placement="right"
        onClose={toggleDrawer}
        visible={drawerVisible}
      >
        <Space direction="vertical">
          <Button onClick={handleReset}>Reset risposte domande</Button>
          <Button onClick={goToQuestionManager}>Gestione domande</Button>
        </Space>
      </Drawer>
    </div>
  );
}

export default App;
