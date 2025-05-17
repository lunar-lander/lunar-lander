import React from 'react';
import styles from './Chat.module.css';

interface ChatProps {
  chatId?: string;
}

const Chat: React.FC<ChatProps> = ({ chatId }) => {
  return (
    <div className={styles.container}>
      {chatId ? (
        <>
          <div className={styles.header}>
            <h2 className={styles.title}>Chat {chatId}</h2>
          </div>
          <div className={styles.messages}>
            {/* Chat messages will go here */}
          </div>
          <div className={styles.inputArea}>
            {/* Input area will go here */}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h2 className={styles.emptyTitle}>Welcome to ChatAAP</h2>
          <p className={styles.emptyText}>
            Start a new chat by clicking the "New Chat" button in the sidebar,
            or select an existing conversation.
          </p>
        </div>
      )}
    </div>
  );
};

export default Chat;