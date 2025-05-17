import React, { createContext, useState, useContext, useEffect } from 'react';
import { Chat, ChatMessage } from '../../shared/types/chat';
import { DbService } from '../services/db';

interface AppContextType {
  currentView: 'chat' | 'settings';
  setCurrentView: (view: 'chat' | 'settings') => void;
  isDarkTheme: boolean;
  toggleTheme: () => void;
  chats: Chat[];
  activeChat: string | null;
  createChat: () => string;
  selectChat: (chatId: string) => void;
  updateChatSummary: (chatId: string, summary: string) => void;
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

  // Load chats from database on initial render
  useEffect(() => {
    const savedChats = DbService.getChats();
    setChats(savedChats);
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

  const value = {
    currentView,
    setCurrentView,
    isDarkTheme,
    toggleTheme,
    chats,
    activeChat,
    createChat,
    selectChat,
    updateChatSummary
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};