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
      
      // Process each selected model - using Promise.all to ensure all messages are added
      const messagePromises = modelIds.map((modelId, index) => {
        // Generate unique ID with timestamp to avoid collisions
        const timestamp = Date.now() + index;
        const assistantMessageId = `msg_${timestamp}_${modelId}`;
        
        // Create initial placeholder message
        const assistantMessage: ChatMessageType = {
          id: assistantMessageId,
          sender: 'assistant',
          content: '',
          timestamp: timestamp, // Ensure unique timestamps
          modelId
        };
        
        console.log(`Creating message ${assistantMessageId} for model ${modelId}`);
        
        // Add message to chat and return a promise wrapper to handle async
        return new Promise<string>(resolve => {
          // Add message to chat
          const result = addMessageToChat(chatId, assistantMessage);
          
          // Short delay to ensure DB operations complete
          setTimeout(() => {
            // Verify message was added
            const chatData = getChat(chatId);
            const messageExists = chatData?.messages.some(m => m.id === assistantMessageId);
            
            if (!messageExists) {
              console.error(`Message ${assistantMessageId} was not properly added to chat ${chatId}`);
            } else {
              console.log(`Successfully added message ${assistantMessageId} to chat ${chatId}`);
            }
            
            // Mark message as streaming and make API call inside a try-catch
            try {
              // First update state to include message in streaming IDs
              setStreamingMessageIds(prev => [...prev, assistantMessageId]);
              
              // Give time for state update to complete with a small delay
              setTimeout(() => {
                // Call LLM API with real implementation
                callLLMApi(chatId, assistantMessageId, modelId, {
                  content,
                  temperature,
                  systemPrompt: systemPrompt
                }).catch(error => {
                  console.error(`Error in API call for ${modelId}:`, error);
                  
                  // Cleanup streaming state on error
                  setStreamingMessageIds(prev => prev.filter(id => id !== assistantMessageId));
                });
              }, 100); // Short delay to ensure state updates happen first
            } catch (error) {
              console.error(`Error setting up API call for ${modelId}:`, error);
              setStreamingMessageIds(prev => prev.filter(id => id !== assistantMessageId));
            }
            
            resolve(assistantMessageId);
          }, 50 * index); // Stagger slightly to avoid race conditions
        });
      });
      
      // Wait for all messages to be added before refreshing
      Promise.all(messagePromises).then(messageIds => {
        console.log(`Successfully added ${messageIds.length} messages to chat ${chatId}`);
        
        // Refresh chat data after all messages have been added
        const updatedChat = getChat(chatId);
        if (updatedChat) {
          console.log(`Chat ${chatId} now has ${updatedChat.messages.length} messages`);
          setChat(updatedChat);
          
          // If this was the first message, wait for first response and then generate summary
          if (isFirstMessage && summaryModelId) {
            // First, we'll wait a moment to let the UI stabilize
            setTimeout(() => {
              console.log(`Setting up summary generation wait for chat ${chatId}`);
              
              // Then, we'll wait for the first model to respond before generating summary
              const waitForFirstResponse = setInterval(() => {
                // Check if there are any messages still streaming
                if (streamingMessageIds.length === 0) {
                  clearInterval(waitForFirstResponse);
                  console.log(`All responses complete, initiating summary generation for ${chatId} with delay`);
                  
                  // Wait a bit longer to make sure everything is stable before generating summary
                  setTimeout(() => {
                    // Double check that the chat still exists and has messages
                    const chatToSummarize = getChat(chatId);
                    if (chatToSummarize && chatToSummarize.messages && chatToSummarize.messages.length > 0) {
                      generateChatSummary(chatId);
                    } else {
                      console.error(`Chat ${chatId} no longer valid before summary generation`);
                    }
                  }, 1000);
                } else {
                  console.log(`Still waiting for ${streamingMessageIds.length} responses to complete before summary`);
                }
              }, 1000);
            }, 500);
          }
        } else {
          console.error(`Failed to retrieve updated chat ${chatId} after adding messages`);
        }
      }).catch(error => {
        console.error(`Error adding messages to chat ${chatId}:`, error);
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate chat summary using the designated summary model
  const generateChatSummary = async (chatId: string) => {
    console.log(`Attempting to generate summary for chat ${chatId}`);
    // Use config summary model ID if available, otherwise use the one from context
    const effectiveSummaryModelId = configSummaryModelId || summaryModelId;
    
    if (!effectiveSummaryModelId) {
      console.log(`No summary model ID available, skipping summary generation`);
      return;
    }
    
    const currentChat = getChat(chatId);
    if (!currentChat) {
      console.error(`Chat ${chatId} not found for summary generation`);
      return;
    }
    
    // Make a copy of the chat to avoid modifying the original
    const chatCopy = JSON.parse(JSON.stringify(currentChat));
    
    // Check if chat has messages
    if (!chatCopy.messages || chatCopy.messages.length === 0) {
      console.warn(`Chat ${chatId} has no messages, skipping summary generation`);
      return;
    }
    
    console.log(`Starting summary generation for chat ${chatId} with ${chatCopy.messages.length} messages`);
    setSummarizing(true);
    
    try {
      // First generate a basic summary as a fallback
      const basicSummary = SummaryGenerator.generateBasicSummary(chatCopy);
      console.log(`Generated basic summary: "${basicSummary}"`);
      
      // Update with basic summary first to ensure we have something
      updateChatSummary(chatId, basicSummary);
      
      // Try to generate an LLM summary in a way that won't affect the chat state
      try {
        // Call the LLM API to generate a real summary - don't let this affect chat
        console.log(`Calling LLM API for better summary using model ${effectiveSummaryModelId}`);
        const llmSummary = await SummaryGenerator.generateLLMSummary(chatCopy, effectiveSummaryModelId);
        console.log(`Generated LLM summary: "${llmSummary}"`);
        
        if (llmSummary && llmSummary.trim() !== '') {
          // Only update if we got a valid summary
          updateChatSummary(chatId, llmSummary);
        }
      } catch (llmError) {
        // Just log the error but don't fail - we already have the basic summary
        console.error("Error generating LLM summary:", llmError);
        // We don't need to do anything here as we already set the basic summary
      }
      
      // Refresh chat data but with safeguards
      const updatedChat = getChat(chatId);
      if (updatedChat && updatedChat.messages && updatedChat.messages.length > 0) {
        // Only update if we still have messages - don't replace a chat with messages with an empty one
        console.log(`Refreshing chat after summary with ${updatedChat.messages.length} messages`);
        setChat(updatedChat);
      } else {
        console.error(`Updated chat has no messages after summary generation!`);
        // If the updated chat is empty but our original had messages, something went wrong
        if (currentChat.messages && currentChat.messages.length > 0) {
          console.log(`Restoring original chat with ${currentChat.messages.length} messages`);
          // Restore the original chat
          setChat(currentChat);
          updateChat(currentChat);
        }
      }
    } catch (error) {
      console.error("Fatal error in summary generation:", error);
      // If a fatal error occurs, restore original chat data
      setChat(currentChat);
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
      
      console.log(`Making API call to ${model.baseUrl} for model ${model.modelName}`);
      
      // Make the API call with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response;
      try {
        response = await fetch(`${model.baseUrl}/chat/completions`, {
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
          }),
          signal: controller.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`API error for model ${model.name}:`, errorData);
          throw new Error(`API returned status ${response.status}: ${errorData || 'Unknown error'}`);
        }
        
        console.log(`API call successful for model ${model.name}`);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error(`API call to ${model.baseUrl} timed out after 30 seconds`);
          throw new Error(`Request to ${model.name} timed out. Please try again.`);
        }
        throw fetchError;
      }
      
      // Make sure we have a valid response object before proceeding
      if (!response) {
        throw new Error('No response received from API');
      }
      
      // Process the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      let content = '';
      const decoder = new TextDecoder();
      
      // Read stream chunks - returns a promise so we can catch errors outside
      const readStream = async (): Promise<void> => {
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
                    try {
                      console.log(`Processing stream chunk for message ${messageId}, content length: ${content.length}`);
                      const chatData = getChat(chatId);
                      if (!chatData) {
                        console.error(`Chat data not found for ID: ${chatId}`);
                        return;
                      }
                      
                      // Find the message to make sure it exists
                      const messageToUpdate = chatData.messages.find(msg => msg.id === messageId);
                      if (!messageToUpdate) {
                        console.error(`Message ${messageId} not found in chat ${chatId}`);
                        
                        // Recreate the missing message and add it to the chat
                        console.log(`Attempting to recreate missing message ${messageId}`);
                        
                        // Extract model ID from messageId (format is msg_timestamp_modelId)
                        const recreatedModelId = messageId.split('_').pop() || '';
                        
                        const recreatedMessage: ChatMessageType = {
                          id: messageId,
                          sender: 'assistant',
                          content: content,
                          timestamp: Date.now(),
                          modelId: recreatedModelId
                        };
                        
                        // Add recreated message to chat
                        addMessageToChat(chatId, recreatedMessage);
                        
                        // Get updated chat data
                        const refreshedChat = getChat(chatId);
                        if (!refreshedChat) {
                          console.error(`Still can't retrieve chat ${chatId} after message recreation`);
                          return;
                        }
                        
                        // Check if message was successfully recreated
                        if (!refreshedChat.messages.some(msg => msg.id === messageId)) {
                          console.error(`Failed to recreate message ${messageId}`);
                          return;
                        }
                        
                        // Set regenerated chat
                        setChat(refreshedChat);
                        return;
                      }
                      
                      const updatedMessages = chatData.messages.map(msg => 
                        msg.id === messageId ? { ...msg, content } : msg
                      );
                      
                      const updatedChat = { ...chatData, messages: updatedMessages };
                      
                      // First update local state to avoid race conditions
                      setChat(updatedChat);
                      
                      // Then update database
                      updateChat(updatedChat);
                      
                      console.log(`Updated message ${messageId}, new content length: ${content.length}`);
                    } catch (updateError) {
                      console.error(`Error updating message content:`, updateError);
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
          
          try {
            // Make sure we preserve the message even when the stream errors out
            const chatData = getChat(chatId);
            if (chatData) {
              // Find the message to make sure it exists
              const messageToUpdate = chatData.messages.find(msg => msg.id === messageId);
              
              if (messageToUpdate) {
                // Update with error indication but preserve any content we have
                const errorMessage = `${content}\n\n[Error: Connection interrupted]`;
                
                const updatedMessages = chatData.messages.map(msg => 
                  msg.id === messageId ? { ...msg, content: errorMessage } : msg
                );
                
                const updatedChat = { ...chatData, messages: updatedMessages };
                
                // Update state first to avoid race conditions
                setChat(updatedChat);
                
                // Then update database
                updateChat(updatedChat);
                console.log(`Preserved message ${messageId} after stream error`);
              }
            }
          } catch (preserveError) {
            console.error('Error preserving message after stream error:', preserveError);
          }
          
          // Finally, mark as no longer streaming
          setStreamingMessageIds(prev => prev.filter(id => id !== messageId));
        }
      };
      
      // Start reading the stream with additional error handling
      readStream().catch(error => {
        console.error(`Unhandled error in readStream for ${modelId}:`, error);
        
        try {
          // Ensure the message is preserved with error information
          const chatData = getChat(chatId);
          if (chatData) {
            const messageToUpdate = chatData.messages.find(msg => msg.id === messageId);
            if (messageToUpdate) {
              // Include any existing content plus error message
              const errorContent = messageToUpdate.content 
                ? `${messageToUpdate.content}\n\n[Error: ${error.message || 'Unknown error'}]`
                : `[Error: ${error.message || 'Unknown error'}]`;
              
              const updatedMessages = chatData.messages.map(msg => 
                msg.id === messageId ? { ...msg, content: errorContent } : msg
              );
              
              const updatedChat = { ...chatData, messages: updatedMessages };
              setChat(updatedChat);
              updateChat(updatedChat);
            }
          }
        } catch (cleanupError) {
          console.error('Error during error cleanup:', cleanupError);
        }
        
        // Mark message as no longer streaming
        setStreamingMessageIds(prev => prev.filter(id => id !== messageId));
      });
      
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