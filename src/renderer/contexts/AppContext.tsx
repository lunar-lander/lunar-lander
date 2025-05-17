import React, { createContext, useState, useContext, useEffect } from 'react';
import { Chat, ChatMessage } from '../../shared/types/chat';
import { Model } from '../../shared/types/model';
import { DbService } from '../services/db';
import { initializeMockData } from '../services/mockData';
import { useConfig } from '../hooks/useConfig';

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
  // Access configuration
  const { summaryModelId: configSummaryModelId, setSummaryModel } = useConfig();
  
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
    
    // Load conversation mode
    const savedConversationMode = localStorage.getItem('conversationMode') || ConversationModeType.ONE_TO_MANY;
    setConversationMode(savedConversationMode as ConversationModeType);
    
    // Load custom configs
    const savedCustomConfigs = JSON.parse(localStorage.getItem('customConfigs') || '[]');
    setCustomConfigs(savedCustomConfigs);
  }, []);
  
  // Sync summary model ID from config
  useEffect(() => {
    if (configSummaryModelId !== undefined && configSummaryModelId !== summaryModelId) {
      setSummaryModelId(configSummaryModelId);
    }
  }, [configSummaryModelId, summaryModelId]);

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

  // No longer used - function has been replaced by callLLMApi in Chat.tsx

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