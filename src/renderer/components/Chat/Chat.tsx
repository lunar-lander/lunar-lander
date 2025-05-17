import React, { useState, useEffect } from 'react';
import { Chat as ChatType, ChatMessage as ChatMessageType } from '../../../shared/types/chat';
import { useAppContext } from '../../contexts/AppContext';
import ChatMessages from './ChatMessages';
import ChatInput, { ChatMode } from './ChatInput';
import styles from './Chat.module.css';
import { SummaryGenerator } from '../../services/summaryGenerator';
import { ConversationModeType } from '../Settings/ConversationMode';
import { useConfig } from '../../hooks/useConfig';

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
  
  const { summaryModelId: configSummaryModelId } = useConfig();

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
    // Use config summary model ID if available, otherwise use the one from context
    const effectiveSummaryModelId = configSummaryModelId || summaryModelId;
    
    if (!effectiveSummaryModelId) return;
    
    const currentChat = getChat(chatId);
    if (!currentChat) return;
    
    setSummarizing(true);
    
    try {
      // Call the LLM API to generate a real summary
      const summary = await SummaryGenerator.generateLLMSummary(currentChat, effectiveSummaryModelId);
      
      // Update the chat title and summary
      updateChatSummary(chatId, summary);
      
      // Refresh chat data
      const updatedChat = getChat(chatId);
      if (updatedChat) {
        setChat(updatedChat);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      // Fallback to basic summary if LLM call fails
      const basicSummary = SummaryGenerator.generateBasicSummary(currentChat);
      updateChatSummary(chatId, basicSummary);
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
      let apiMessages = [];
      
      // Always include the system prompt as the first message
      if (request.systemPrompt) {
        apiMessages.push({
          role: 'system',
          content: request.systemPrompt
        });
      }
      
      // Add chat history based on conversation mode
      const chatMessages = currentChat.messages.filter(msg => msg.id !== messageId);
      
      // Filter messages based on conversation mode
      let filteredMessages = [];
      
      // Sort messages by timestamp to maintain correct ordering
      const sortedChatMessages = [...chatMessages].sort((a, b) => a.timestamp - b.timestamp);
      
      if (conversationMode === ConversationModeType.ONE_TO_MANY) {
        // Only include user messages in one-to-many mode
        // Each LLM responds independently without seeing other LLM responses
        filteredMessages = sortedChatMessages.filter(msg => msg.sender === 'user');
      } else if (conversationMode === ConversationModeType.MANY_TO_MANY) {
        // In many-to-many mode, all models see all messages (from users and all other models)
        // This creates a collaborative environment where models can reference each other
        filteredMessages = sortedChatMessages;
      } else if (conversationMode === ConversationModeType.ROUND_ROBIN) {
        // In round-robin mode, models only see user messages and their own previous responses
        // Each model has its own conversation thread with the user
        filteredMessages = sortedChatMessages.filter(
          msg => msg.sender === 'user' || (msg.sender === 'assistant' && msg.modelId === modelId)
        );
      } else if (conversationMode === ConversationModeType.CUSTOM) {
        // For custom mode, default to many-to-many for now
        // In a full implementation, you would apply custom routing rules here
        filteredMessages = sortedChatMessages;
      }
      
      console.log(`Conversation mode: ${conversationMode}`);
      console.log(`Filtered ${chatMessages.length} total messages to ${filteredMessages.length} messages for model ${modelId}`); 
      console.log('Filtered message IDs:', filteredMessages.map(m => m.id));
      
      // Convert filtered messages to API format
      filteredMessages.forEach(msg => {
        if (msg.sender === 'user') {
          apiMessages.push({
            role: 'user',
            content: msg.content
          });
        } else if (msg.sender === 'assistant' && msg.modelId) {
          apiMessages.push({
            role: 'assistant',
            content: msg.content
          });
        }
      });
      
      // Make the API call
      const response = await fetch(`${model.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`
        },
        body: JSON.stringify({
          model: model.modelName,
          messages: apiMessages,
          temperature: request.temperature,
          stream: true // Enable streaming
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API error:", errorData);
        throw new Error(`API returned status ${response.status}: ${errorData || 'Unknown error'}`);
      }
      
      // Process the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      let content = '';
      const decoder = new TextDecoder();
      
      // Read stream chunks
      const readStream = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            // End of stream, remove from streaming list
            setStreamingMessageIds(prev => prev.filter(id => id !== messageId));
            return;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Process the chunk to extract the content
          const lines = chunk
            .toString()
            .split('\n')
            .filter(line => line.trim() !== '');
          
          for (const line of lines) {
            try {
              // Handle SSE format properly
              if (!line.startsWith('data:')) continue;
              
              const message = line.replace(/^data: /, '').trim();
              
              // Skip [DONE] messages
              if (message === '[DONE]') continue;
              
              // Skip empty messages
              if (!message) continue;
              
              try {
                const parsed = JSON.parse(message);
                
                // Extract content from delta - handle case where choices might be undefined
                if (parsed.choices && parsed.choices.length > 0) {
                  const delta = parsed.choices[0]?.delta?.content || '';
                  if (delta) {
                    content += delta;
                    
                    // Update message content in the chat
                    const chatData = getChat(chatId);
                    if (chatData) {
                      const updatedMessages = chatData.messages.map(msg => 
                        msg.id === messageId ? { ...msg, content } : msg
                      );
                      
                      const updatedChat = { ...chatData, messages: updatedMessages };
                      updateChat(updatedChat);
                      setChat(updatedChat);
                    }
                  }
                }
              } catch (parseError) {
                // Silently ignore parse errors for individual messages
                // This happens frequently with partial chunks in streaming
              }
            } catch (e) {
              // Only log severe errors, not parsing issues
              if (e instanceof SyntaxError === false) {
                console.warn('Error processing message:', e);
              }
            }
          }
          
          // Continue reading
          readStream();
        } catch (error) {
          console.error('Error reading stream:', error);
          setStreamingMessageIds(prev => prev.filter(id => id !== messageId));
        }
      };
      
      // Start reading the stream
      readStream();
      
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