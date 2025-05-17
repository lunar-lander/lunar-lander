import React, { useState, useEffect } from 'react';
import { Chat as ChatType, ChatMessage as ChatMessageType } from '../../../shared/types/chat';
import { useAppContext } from '../../contexts/AppContext';
import ChatMessages from './ChatMessages';
import ChatInput, { ChatMode } from './ChatInput';
import styles from './Chat.module.css';
import { SummaryGenerator } from '../../services/summaryGenerator';
import { ConversationModeType } from '../Settings/ConversationMode';

// Map between ChatMode and ConversationModeType
const getModeFromConversationMode = (mode: ConversationModeType): ChatMode => {
  switch (mode) {
    case ConversationModeType.ONE_TO_MANY:
      return ChatMode.ONE_TO_MANY;
    case ConversationModeType.MANY_TO_MANY:
      return ChatMode.MANY_TO_MANY;
    case ConversationModeType.ROUND_ROBIN:
      return ChatMode.ROUND_ROBIN;
    case ConversationModeType.CUSTOM:
      return ChatMode.CUSTOM;
    default:
      return ChatMode.ONE_TO_MANY;
  }
};

interface ChatProps {
  chatId?: string;
}

const Chat: React.FC<ChatProps> = ({ chatId }) => {
  const [chat, setChat] = useState<ChatType | null>(null);
  const [activeModelIds, setActiveModelIds] = useState<string[]>([]);
  const [streamingMessageIds, setStreamingMessageIds] = useState<string[]>([]);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summarizing, setSummarizing] = useState<boolean>(false);

  const { 
    models, 
    getChat, 
    addMessageToChat, 
    updateChat,
    updateChatSummary,
    conversationMode,
    systemPrompt,
    summaryModelId
  } = useAppContext();

  // Convert from settings conversation mode to chat mode
  const chatMode = getModeFromConversationMode(conversationMode);

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
    temperature: number,
    mode: ChatMode
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
      
      // If this is the first message in the chat, flag for summary generation
      const isFirstMessage = chat.messages.length === 0;
      
      // Process each selected model
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
        
        // Call LLM API with real implementation
        callLLMApi(chatId, assistantMessageId, modelId, {
          content,
          temperature,
          systemPrompt: systemPrompt
        });
      });
      
      // Refresh chat data
      const updatedChat = getChat(chatId);
      if (updatedChat) {
        setChat(updatedChat);
        
        // If this was the first message, wait for first response and then generate summary
        if (isFirstMessage && summaryModelId) {
          // Wait for the first model to respond before generating summary
          const waitForFirstResponse = setInterval(() => {
            if (streamingMessageIds.length === 0) {
              clearInterval(waitForFirstResponse);
              generateChatSummary(chatId);
            }
          }, 500);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate chat summary using the designated summary model
  const generateChatSummary = async (chatId: string) => {
    if (!summaryModelId) return;
    
    const currentChat = getChat(chatId);
    if (!currentChat) return;
    
    setSummarizing(true);
    
    try {
      // In a real app, this would use the LLM to generate a summary
      // For now, we'll simulate it with a delay
      const summary = await SummaryGenerator.generateLLMSummary(currentChat, summaryModelId);
      
      // Update the chat title and summary
      updateChatSummary(chatId, summary);
      
      // Refresh chat data
      const updatedChat = getChat(chatId);
      if (updatedChat) {
        setChat(updatedChat);
      }
    } finally {
      setSummarizing(false);
    }
  };

  // Call LLM API and handle streaming response
  const callLLMApi = async (
    chatId: string, 
    messageId: string, 
    modelId: string,
    request: {
      content: string;
      temperature: number;
      systemPrompt: string;
    }
  ) => {
    try {
      // Find the model configuration
      const model = models.find(m => m.id === modelId);
      if (!model) {
        throw new Error(`Model with ID ${modelId} not found`);
      }

      // Get the current chat to determine context
      const currentChat = getChat(chatId);
      if (!currentChat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }

      // Prepare messages for the API call based on conversation mode
      let contextMessages = [];
      
      // Always include the system prompt as the first message
      if (request.systemPrompt) {
        contextMessages.push({
          role: 'system',
          content: request.systemPrompt
        });
      }
      
      // Add chat history based on conversation mode
      const chatMessages = currentChat.messages.filter(msg => msg.id !== messageId);
      
      // In a real implementation, we would determine which messages to include
      // based on the conversation mode
      chatMessages.forEach(msg => {
        if (msg.sender === 'user') {
          contextMessages.push({
            role: 'user',
            content: msg.content
          });
        } else if (msg.sender === 'assistant' && msg.modelId) {
          // For assistant messages, check if they should be included based on conversation mode
          let shouldInclude = false;
          
          if (conversationMode === ConversationModeType.MANY_TO_MANY) {
            // Include all assistant messages
            shouldInclude = true;
          } else if (conversationMode === ConversationModeType.ROUND_ROBIN) {
            // Only include messages from this model
            shouldInclude = msg.modelId === modelId;
          }
          
          if (shouldInclude) {
            contextMessages.push({
              role: 'assistant',
              content: msg.content
            });
          }
        }
      });
      
      // In a real implementation, this would call the actual API
      // For now, we'll simulate a streaming response
      let content = '';
      const streamingContent = `I am ${model.name} (${model.modelName}) responding with temperature ${request.temperature} in ${conversationMode} mode.
      
My API endpoint is at ${model.baseUrl}.

You asked: "${request.content}"

Here's my response:
      
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;
      
      const words = streamingContent.split(' ');
      
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
      }, 50); // Faster streaming for better UX
      
    } catch (error) {
      console.error("Error calling LLM API:", error);
      
      // Update the message with the error
      const chatData = getChat(chatId);
      if (chatData) {
        const errorMessage = `Error: Failed to get response from the model. ${error.message}`;
        
        const updatedMessages = chatData.messages.map(msg => 
          msg.id === messageId ? { ...msg, content: errorMessage } : msg
        );
        
        const updatedChat = { ...chatData, messages: updatedMessages };
        updateChat(updatedChat);
        setChat(updatedChat);
      }
      
      // Remove from streaming list
      setStreamingMessageIds(prev => prev.filter(id => id !== messageId));
    }
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
    // This is now handled by settings, but we'll keep the handler for the UI
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
            <h2 className={styles.title}>
              {chat.title === 'New Chat' && chat.summary !== 'Start a new conversation'
                ? chat.summary
                : chat.title}
              {summarizing && <span className={styles.summarizing}> (Summarizing...)</span>}
            </h2>
            <div className={styles.headerActions}>
              <button 
                className={styles.headerButton} 
                title="Clear hidden messages"
                onClick={() => setHiddenMessageIds([])}
              >
                👁️
              </button>
              <button 
                className={styles.headerButton} 
                title="Regenerate Summary"
                onClick={() => chat && chatId && generateChatSummary(chatId)}
                disabled={!summaryModelId || chat.messages.length === 0}
              >
                🔄
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