import React from 'react';
import styles from './Sidebar.module.css';
import { useAppContext } from '../../contexts/AppContext';

const Sidebar: React.FC = () => {
  const { 
    chats, 
    activeChat, 
    isDarkTheme, 
    toggleTheme, 
    createChat, 
    selectChat, 
    setCurrentView 
  } = useAppContext();

  // Handle new chat button click
  const handleNewChat = () => {
    createChat();
  };

  // Handle settings click
  const handleSettingsClick = () => {
    setCurrentView('settings');
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <button 
          className={styles.newChatButton}
          onClick={handleNewChat}
        >
          <span>+</span> New Chat
        </button>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.actionButton} 
          onClick={toggleTheme}
          title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkTheme ? '☀️' : '🌙'}
        </button>
        <button 
          className={styles.actionButton}
          onClick={handleSettingsClick}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      <div className={styles.chatList}>
        {chats.length === 0 ? (
          <div className={styles.noChats}>
            No chat history yet
          </div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.id} 
              className={`${styles.chatItem} ${activeChat === chat.id ? styles.active : ''}`}
              onClick={() => selectChat(chat.id)}
            >
              <div className={styles.chatTitle}>{chat.title}</div>
              <div className={styles.chatSummary}>{chat.summary}</div>
              <div className={styles.chatDate}>{chat.date}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;