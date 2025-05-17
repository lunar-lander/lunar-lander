import React, { useState, useEffect } from 'react';
import Button from './components/common/Button';
import Card from './components/common/Card';
import styles from './App.module.css';

// Import the configManager types
const { ipcRenderer } = window.require('electron');

const App: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  // Effect to toggle dark theme class on document body
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
    // In a real app, we would also update the config via IPC
    // ipcRenderer.invoke('config:toggle-system-theme', !isDarkTheme);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>ChatAAP</h1>
        <Button 
          variant="ghost" 
          onClick={toggleTheme}
        >
          {isDarkTheme ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Button>
      </header>
      
      <main className={styles.main}>
        <div className={styles.demoSection}>
          <h2>Component Demo</h2>
          
          <div className={styles.buttonsDemo}>
            <h3>Buttons</h3>
            <div className={styles.buttonGroup}>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            
            <div className={styles.buttonGroup}>
              <Button variant="primary" size="small">Small</Button>
              <Button variant="primary" size="medium">Medium</Button>
              <Button variant="primary" size="large">Large</Button>
            </div>
          </div>
          
          <div className={styles.cardsDemo}>
            <h3>Cards</h3>
            <div className={styles.cardGroup}>
              <Card>
                <Card.Header>
                  <h3>Default Card</h3>
                </Card.Header>
                <Card.Body>
                  <p>This is a default card with shadow effect.</p>
                </Card.Body>
                <Card.Footer>
                  <Button variant="ghost" size="small">Cancel</Button>
                  <Button size="small">OK</Button>
                </Card.Footer>
              </Card>
              
              <Card variant="flat">
                <Card.Header>
                  <h3>Flat Card</h3>
                </Card.Header>
                <Card.Body>
                  <p>This is a flat card with border instead of shadow.</p>
                </Card.Body>
                <Card.Footer>
                  <Button variant="ghost" size="small">Cancel</Button>
                  <Button size="small">OK</Button>
                </Card.Footer>
              </Card>
              
              <Card variant="elevated">
                <Card.Header>
                  <h3>Elevated Card</h3>
                </Card.Header>
                <Card.Body>
                  <p>This is an elevated card with more pronounced shadow.</p>
                </Card.Body>
                <Card.Footer>
                  <Button variant="ghost" size="small">Cancel</Button>
                  <Button size="small">OK</Button>
                </Card.Footer>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;