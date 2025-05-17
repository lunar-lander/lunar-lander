import React, { useState, useEffect } from 'react';
import { Chat as ChatType, ChatMessage as ChatMessageType } from '../../../shared/types/chat';
import { useAppContext } from '../../contexts/AppContext';
import ChatMessages from './ChatMessages';
import ChatInput, { ChatMode } from './ChatInput';
import styles from './Chat.module.css';

interface ChatProps {
  chatId?: string;
}

const Chat: React.FC<ChatProps> = ({ chatId }) => {
  const [chat, setChat] = useState<ChatType | null>(null);
  const [activeModelIds, setActiveModelIds] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.ONE_TO_MANY);
  const [streamingMessageIds, setStreamingMessageIds] = useState<string[]>([]);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { 
    models, 
    getChat, 
    addMessageToChat, 
    updateChat 
  } = useAppContext();

  // Load chat data when chatId changes
  useEffect(() => {
    if (chatId) {
      const chatData = getChat(chatId);
      if (chatData) {
        setChat(chatData);
      }
    } else {
      setChat(null);
    }
  }, [chatId, getChat]);

  // Set initially active models
  useEffect(() => {
    // Set all active models as initially active
    setActiveModelIds(models.filter(m => m.isActive).map(m => m.id));
  }, [models]);

  // Handle sending a new message
  const handleSendMessage = async (
    content: string, 
    modelIds: string[], 
    _temperature: number, // Unused for now, but will be used for real API calls
    _mode: ChatMode       // Unused for now, but will be used for conversation modes
  ) => {
    if (!chatId || !chat) return;
    
    setIsLoading(true);
    
    try {
      // Create and add user message
      const userMessage: ChatMessageType = {
        id: `msg_${Date.now()}_user`,
        sender: 'user',
        content,
        timestamp: Date.now()
      };
      
      // Add user message and start generating replies from selected models
      addMessageToChat(chatId, userMessage);
      
      // Create streaming messages
      modelIds.forEach((modelId, index) => {
        const assistantMessageId = `msg_${Date.now()}_${modelId}`;
        
        // Create initial placeholder message
        const assistantMessage: ChatMessageType = {
          id: assistantMessageId,
          sender: 'assistant',
          content: '',
          timestamp: Date.now() + index, // Add index to ensure unique timestamps
          modelId
        };
        
        // Add message to chat
        addMessageToChat(chatId, assistantMessage);
        
        // Mark message as streaming
        setStreamingMessageIds(prev => [...prev, assistantMessageId]);
        
        // Simulate streaming response
        simulateStreamingResponse(chatId, assistantMessageId, modelId);
      });
      
      // Refresh chat data
      const updatedChat = getChat(chatId);
      if (updatedChat) {
        setChat(updatedChat);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate streaming response from a model
  const simulateStreamingResponse = (
    chatId: string, 
    messageId: string, 
    _modelId: string // Unused in simulation, but would be used for real API calls
  ) => {
    let content = '';
    const responses = [
      'I am thinking about your question...',
      'That\'s an interesting question. Let me consider it...',
      'Here is my response to your inquiry. I hope it helps with what you\'re looking for.',
      'Based on the information provided, I would suggest the following approach.'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const words = randomResponse.split(' ');
    
    const streamInterval = setInterval(() => {
      if (words.length > 0) {
        content += words.shift() + ' ';
        
        // Update message content
        const chatData = getChat(chatId);
        if (chatData) {
          const updatedMessages = chatData.messages.map(msg => 
            msg.id === messageId ? { ...msg, content } : msg
          );
          
          const updatedChat = { ...chatData, messages: updatedMessages };
          updateChat(updatedChat);
          setChat(updatedChat);
        }
      } else {
        clearInterval(streamInterval);
        setStreamingMessageIds(prev => prev.filter(id => id !== messageId));
      }
    }, 200);
  };

  // Toggle model selection
  const handleToggleModel = (modelId: string) => {
    setActiveModelIds(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  // Change chat mode
  const handleModeChange = (mode: ChatMode) => {
    setChatMode(mode);
  };

  // Toggle message visibility
  const handleToggleMessageVisibility = (messageId: string) => {
    setHiddenMessageIds(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  return (
    <div className={styles.container}>
      {chatId && chat ? (
        <>
          <div className={styles.header}>
            <h2 className={styles.title}>{chat.title}</h2>
            <div className={styles.headerActions}>
              <button className={styles.headerButton} title="Clear hidden messages">
                👁️
              </button>
              <button className={styles.headerButton} title="Export chat">
                📤
              </button>
            </div>
          </div>
          <div className={styles.messagesContainer}>
            <ChatMessages
              messages={chat.messages}
              models={models}
              streamingMessageIds={streamingMessageIds}
              hiddenMessageIds={hiddenMessageIds}
              onToggleMessageVisibility={handleToggleMessageVisibility}
            />
          </div>
          <ChatInput
            models={models}
            activeModelIds={activeModelIds}
            onSendMessage={handleSendMessage}
            onToggleModel={handleToggleModel}
            onModeChange={handleModeChange}
            disabled={isLoading || streamingMessageIds.length > 0}
            currentMode={chatMode}
          />
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