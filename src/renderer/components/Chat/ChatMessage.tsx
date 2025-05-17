import React from 'react';
import { ChatMessage as ChatMessageType } from '../../../shared/types/chat';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: ChatMessageType;
  modelName?: string;
  isStreaming?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: (messageId: string) => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  modelName,
  isStreaming = false,
  isVisible = true,
  onToggleVisibility
}) => {
  const { id, sender, content, timestamp } = message;
  const isUser = sender === 'user';

  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      onToggleVisibility(id);
    }
  };

  return (
    <div className={`${styles.messageContainer} ${styles[sender]} ${!isVisible ? styles.hidden : ''}`}>
      {!isUser && (
        <button 
          className={styles.toggleVisibility} 
          onClick={handleToggleVisibility}
          aria-label={isVisible ? 'Hide message' : 'Show message'}
          title={isVisible ? 'Hide message' : 'Show message'}
        >
          {isVisible ? '👁️' : '👁️‍🗨️'}
        </button>
      )}
      
      <div className={styles.messageContent}>
        {!isUser && message.modelId && (
          <span className={styles.modelTag}>
            {modelName || `Model ID: ${message.modelId}`}
          </span>
        )}
        
        <div className={isStreaming ? styles.streaming : ''}>
          {content}
        </div>
        
        <div className={styles.timestamp}>
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;