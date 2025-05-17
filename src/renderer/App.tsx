import React, { useState, useEffect } from 'react';
import styles from './App.module.css';

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
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>ChatAAP</h1>
        <button onClick={toggleTheme}>
          {isDarkTheme ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>
      
      <main className={styles.main}>
        <div className={styles.content}>
          <h2>Welcome to ChatAAP</h2>
          <p>Multi-LLM Chat Application</p>
        </div>
      </main>
    </div>
  );
};

export default App;