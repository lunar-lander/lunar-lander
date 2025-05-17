import React, { createContext, useState, useContext, useEffect } from 'react';
import { Chat, ChatMessage } from '../../shared/types/chat';
import { Model } from '../../shared/types/model';
import { DbService } from '../services/db';
import { initializeMockData } from '../services/mockData';

// Import types from ConversationMode
import { ConversationModeType } from '../components/Settings/ConversationMode';

// Define the CustomConfig interface
export interface CustomConfig {
  id: string;
  name: string;
  description: string;
  rules: string;
}

interface AppContextType {
  // View management
  currentView: 'chat' | 'settings';
  setCurrentView: (view: 'chat' | 'settings') => void;
  
  // Theme
  isDarkTheme: boolean;
  toggleTheme: () => void;
  
  // Chats
  chats: Chat[];
  activeChat: string | null;
  createChat: () => string;
  selectChat: (chatId: string) => void;
  updateChatSummary: (chatId: string, summary: string) => void;
  addMessageToChat: (chatId: string, message: ChatMessage) => void;
  getChat: (chatId: string) => Chat | null;
  updateChat: (chat: Chat) => void;
  
  // Models
  models: Model[];
  getModel: (modelId: string) => Model | null;
  addModel: (model: Omit<Model, 'id'>) => void;
  updateModel: (model: Partial<Model> & { id: string }) => void;
  deleteModel: (modelId: string) => void;
  
  // Message handling
  addMessageAndGenerateReplies: (chatId: string, content: string, modelIds: string[]) => void;
  
  // System prompt
  systemPrompt: string;
  updateSystemPrompt: (prompt: string) => void;
  
  // Summary model
  summaryModelId: string | null;
  setSummaryModelId: (modelId: string) => void;
  
  // Conversation mode
  conversationMode: ConversationModeType;
  updateConversationMode: (mode: ConversationModeType) => void;
  
  // Custom configurations
  customConfigs: CustomConfig[];
  addCustomConfig: (config: Omit<CustomConfig, 'id'> & { id?: string }) => void;
  updateCustomConfig: (config: Partial<CustomConfig> & { id: string }) => void;
  deleteCustomConfig: (configId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check for dark theme preference in localStorage or system
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  const initialDarkTheme = savedTheme 
    ? savedTheme === 'dark' 
    : prefersDarkMode;

  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(initialDarkTheme);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const [models, setModels] = useState<Model[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [summaryModelId, setSummaryModelId] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<ConversationModeType>(ConversationModeType.ONE_TO_MANY);
  const [customConfigs, setCustomConfigs] = useState<CustomConfig[]>([]);

  // Initialize app data on first load
  useEffect(() => {
    // Load mock data for development
    initializeMockData();
    
    // Load chats from database
    const savedChats = DbService.getChats();
    setChats(savedChats);
    
    // Load models from database
    const savedModels = DbService.getModels();
    setModels(savedModels);
    
    // Load system prompt
    const savedSystemPrompt = localStorage.getItem('systemPrompt') || '';
    setSystemPrompt(savedSystemPrompt);
    
    // Load summary model id
    const savedSummaryModelId = localStorage.getItem('summaryModelId') || null;
    setSummaryModelId(savedSummaryModelId);
    
    // Load conversation mode
    const savedConversationMode = localStorage.getItem('conversationMode') || ConversationModeType.ONE_TO_MANY;
    setConversationMode(savedConversationMode as ConversationModeType);
    
    // Load custom configs
    const savedCustomConfigs = JSON.parse(localStorage.getItem('customConfigs') || '[]');
    setCustomConfigs(savedCustomConfigs);
  }, []);

  // Apply theme class to document body
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const createChat = () => {
    const newChatId = `chat_${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      title: 'New Chat',
      summary: 'Start a new conversation',
      date: new Date().toLocaleDateString(),
      messages: [],
      lastUpdated: Date.now()
    };
    
    DbService.saveChat(newChat);
    setChats([newChat, ...chats]);
    setActiveChat(newChatId);
    return newChatId;
  };

  const selectChat = (chatId: string) => {
    setActiveChat(chatId);
    setCurrentView('chat');
  };

  const updateChatSummary = (chatId: string, summary: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      const updatedChat = { ...chat, summary };
      DbService.saveChat(updatedChat);
      setChats(chats.map(c => c.id === chatId ? updatedChat : c));
    }
  };

  // Add a message to chat
  const addMessageToChat = (chatId: string, message: ChatMessage) => {
    DbService.addMessageToChat(chatId, message);
    
    // Refresh chats list
    setChats(DbService.getChats());
  };
  
  // Get a specific chat
  const getChat = (chatId: string): Chat | null => {
    return DbService.getChat(chatId);
  };
  
  // Update an entire chat
  const updateChat = (chat: Chat) => {
    DbService.saveChat(chat);
    
    // Refresh chats list
    setChats(DbService.getChats());
  };
  
  // Get a specific model
  const getModel = (modelId: string): Model | null => {
    return DbService.getModel(modelId);
  };
  
  // Add a new model
  const addModel = (model: Omit<Model, 'id'>) => {
    const newModel = DbService.addModel(model);
    setModels([...models, newModel]);
    return newModel;
  };
  
  // Update an existing model
  const updateModel = (model: Partial<Model> & { id: string }) => {
    const updatedModel = DbService.updateModel(model);
    if (updatedModel) {
      setModels(models.map(m => m.id === model.id ? updatedModel : m));
    }
    return updatedModel;
  };
  
  // Delete a model
  const deleteModel = (modelId: string) => {
    DbService.deleteModel(modelId);
    setModels(models.filter(model => model.id !== modelId));
    
    // If this was the summary model, clear the summary model ID
    if (summaryModelId === modelId) {
      localStorage.removeItem('summaryModelId');
      setSummaryModelId(null);
    }
  };
  
  // Update system prompt
  const updateSystemPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    localStorage.setItem('systemPrompt', prompt);
  };
  
  // Update conversation mode
  const updateConversationMode = (mode: ConversationModeType) => {
    setConversationMode(mode);
    localStorage.setItem('conversationMode', mode);
  };
  
  // Add a custom configuration
  const addCustomConfig = (config: Omit<CustomConfig, 'id'> & { id?: string }) => {
    const newConfig: CustomConfig = {
      id: config.id || `config_${Date.now()}`,
      name: config.name,
      description: config.description,
      rules: config.rules
    };
    
    setCustomConfigs([...customConfigs, newConfig]);
    localStorage.setItem('customConfigs', JSON.stringify([...customConfigs, newConfig]));
    return newConfig;
  };
  
  // Update a custom configuration
  const updateCustomConfig = (config: Partial<CustomConfig> & { id: string }) => {
    const existingConfigIndex = customConfigs.findIndex(c => c.id === config.id);
    
    if (existingConfigIndex !== -1) {
      const updatedConfigs = [...customConfigs];
      updatedConfigs[existingConfigIndex] = {
        ...updatedConfigs[existingConfigIndex],
        ...config
      };
      
      setCustomConfigs(updatedConfigs);
      localStorage.setItem('customConfigs', JSON.stringify(updatedConfigs));
      return updatedConfigs[existingConfigIndex];
    }
    
    return null;
  };
  
  // Delete a custom configuration
  const deleteCustomConfig = (configId: string) => {
    const updatedConfigs = customConfigs.filter(config => config.id !== configId);
    setCustomConfigs(updatedConfigs);
    localStorage.setItem('customConfigs', JSON.stringify(updatedConfigs));
  };

  // Add user message and generate replies from multiple LLMs
  const addMessageAndGenerateReplies = (chatId: string, content: string, modelIds: string[]) => {
    // First add the user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      content,
      timestamp: Date.now()
    };
    
    DbService.addMessageToChat(chatId, userMessage);
    
    // Generate response for each selected model based on conversation mode
    modelIds.forEach((modelId, index) => {
      // Create placeholder message that will be updated
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${index}`,
        sender: 'assistant',
        content: 'Thinking...',
        timestamp: Date.now() + index, // Add index to ensure unique timestamps
        modelId
      };
      
      DbService.addMessageToChat(chatId, assistantMessage);
      
      // Get full chat context based on conversation mode
      const chat = DbService.getChat(chatId);
      let contextMessages = [];
      
      if (chat) {
        if (conversationMode === ConversationModeType.ONE_TO_MANY) {
          // Only include user messages
          contextMessages = chat.messages.filter(msg => msg.sender === 'user');
        } else if (conversationMode === ConversationModeType.MANY_TO_MANY) {
          // Include all messages
          contextMessages = chat.messages;
        } else if (conversationMode === ConversationModeType.ROUND_ROBIN) {
          // Include user messages and responses from this specific model
          contextMessages = chat.messages.filter(
            msg => msg.sender === 'user' || (msg.sender === 'assistant' && msg.modelId === modelId)
          );
        } else if (conversationMode === ConversationModeType.CUSTOM) {
          // For custom modes, find the active custom config and apply its rules
          const activeConfig = customConfigs[0]; // Default to first config if multiple exist
          if (activeConfig) {
            // Here we would implement custom routing logic based on rules
            // For now, default to many-to-many behavior
            contextMessages = chat.messages;
          } else {
            // Fall back to many-to-many if no config exists
            contextMessages = chat.messages;
          }
        }
      }
      
      // Simulate response generation - in a real app, this would call the API
      // and would use the contextMessages and systemPrompt
      setTimeout(() => {
        const updatedMessage = {
          ...assistantMessage,
          content: `This is a simulated response from Model ID: ${modelId}. In a real application, this would be the actual response from the LLM using the ${conversationMode} conversation mode.`
        };
        
        const chat = DbService.getChat(chatId);
        if (chat) {
          const updatedChat = {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === assistantMessage.id ? updatedMessage : msg
            )
          };
          
          DbService.saveChat(updatedChat);
          
          // Update chat list
          setChats(DbService.getChats());
        }
      }, 1000 + Math.random() * 2000); // Random delay to simulate different response times
    });
    
    // Refresh chats list
    setChats(DbService.getChats());
  };

  const value = {
    // View management
    currentView,
    setCurrentView,
    
    // Theme
    isDarkTheme,
    toggleTheme,
    
    // Chats
    chats,
    activeChat,
    createChat,
    selectChat,
    updateChatSummary,
    addMessageToChat,
    getChat,
    updateChat,
    
    // Models
    models,
    getModel,
    addModel,
    updateModel,
    deleteModel,
    
    // Message handling
    addMessageAndGenerateReplies,
    
    // System prompt
    systemPrompt,
    updateSystemPrompt,
    
    // Summary model
    summaryModelId,
    setSummaryModelId,
    
    // Conversation mode
    conversationMode,
    updateConversationMode,
    
    // Custom configurations
    customConfigs,
    addCustomConfig,
    updateCustomConfig,
    deleteCustomConfig
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};