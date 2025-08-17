import React, { createContext, useState, useContext, useEffect } from "react";
import { Chat, ChatMessage } from "../../shared/types/chat";
import { Model } from "../../shared/types/model";
import { DbService } from "../services/db";
import { initializeMockData } from "../services/mockData";
import { useConfig } from "../hooks/useConfig";
import { ThemeConfig } from "../../main/themes";

// Import types from ConversationMode
import { ConversationModeType } from "../components/Settings/ConversationMode";

// Utility function to determine if a theme is light or dark
const isThemeLight = (theme: ThemeConfig): boolean => {
  // Convert hex to RGB and calculate luminance
  const hex = theme.background.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If luminance is greater than 0.5, it's a light theme
  return luminance > 0.5;
};

// Define the CustomConfig interface
export interface CustomConfig {
  id: string;
  name: string;
  description: string;
  rules: string;
}

interface AppContextType {
  // View management
  currentView: "chat" | "settings";
  setCurrentView: (view: "chat" | "settings") => void;

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
  updateChatSummaryManual: (chatId: string, summary: string) => boolean;
  starChat: (chatId: string) => void;
  unstarChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  deleteAllChats: () => void;

  // Models
  models: Model[];
  getModel: (modelId: string) => Model | null;
  addModel: (model: Omit<Model, "id">) => void;
  updateModel: (model: Partial<Model> & { id: string }) => void;
  deleteModel: (modelId: string) => void;

  // Message handling
  addMessageAndGenerateReplies: (
    chatId: string,
    content: string,
    modelIds: string[]
  ) => void;

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
  addCustomConfig: (config: Omit<CustomConfig, "id"> & { id?: string }) => void;
  updateCustomConfig: (config: Partial<CustomConfig> & { id: string }) => void;
  deleteCustomConfig: (configId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Access configuration
  const { summaryModelId: configSummaryModelId, setSummaryModel } = useConfig();

  // Check for dark theme preference in localStorage or system
  const prefersDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("theme");
  const initialDarkTheme = savedTheme ? savedTheme === "dark" : prefersDarkMode;

  const [currentView, setCurrentView] = useState<"chat" | "settings">("chat");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(initialDarkTheme);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const [models, setModels] = useState<Model[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [summaryModelId, setSummaryModelId] = useState<string | null>(null);
  const [conversationMode, setConversationMode] =
    useState<ConversationModeType>(ConversationModeType.ISOLATED);
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
    const savedSystemPrompt = localStorage.getItem("systemPrompt") || "";
    setSystemPrompt(savedSystemPrompt);

    // Load conversation mode
    const savedConversationMode =
      localStorage.getItem("conversationMode") || ConversationModeType.ISOLATED;
    setConversationMode(savedConversationMode as ConversationModeType);

    let effectiveMode = Object.values(ConversationModeType).includes(
      savedConversationMode as ConversationModeType
    )
      ? (savedConversationMode as ConversationModeType)
      : ConversationModeType.ISOLATED;

    console.log(
      `Setting conversation mode: ${effectiveMode} (was: ${
        savedConversationMode || "not set"
      })`
    );

    setConversationMode(effectiveMode);

    // Load custom configs
    const savedCustomConfigs = JSON.parse(
      localStorage.getItem("customConfigs") || "[]"
    );
    setCustomConfigs(savedCustomConfigs);
  }, []);

  // Sync summary model ID from config
  useEffect(() => {
    if (
      configSummaryModelId !== undefined &&
      configSummaryModelId !== summaryModelId
    ) {
      setSummaryModelId(configSummaryModelId);
    }
  }, [configSummaryModelId, summaryModelId]);

  // Get config for theme management
  const { currentTheme } = useConfig();

  // Sync isDarkTheme state with currentTheme changes
  useEffect(() => {
    if (currentTheme) {
      const isCurrentThemeDark = !isThemeLight(currentTheme);
      if (isDarkTheme !== isCurrentThemeDark) {
        console.log(`Theme sync: Updating isDarkTheme from ${isDarkTheme} to ${isCurrentThemeDark} for theme "${currentTheme.name}"`);
        setIsDarkTheme(isCurrentThemeDark);
      }
    }
  }, [currentTheme, isDarkTheme]);

  // Apply theme class to document body
  useEffect(() => {
    if (!currentTheme) return;

    console.log(`Applying theme: "${currentTheme.name}" (isDarkTheme: ${isDarkTheme})`);

    // Remove all theme classes
    document.body.classList.forEach((className) => {
      if (className.startsWith("theme-")) {
        document.body.classList.remove(className);
      }
    });

    // Add the appropriate theme class with spaces replaced by hyphens
    const themeClassName = `theme-${currentTheme.name.replace(/\s+/g, "-")}`;
    document.body.classList.add(themeClassName);
    
    console.log(`Added theme class: ${themeClassName}`);

    // Sync new theme variables with old CSS variable names for compatibility
    const root = document.documentElement;
    root.style.setProperty('--primary-color', currentTheme.primary);
    root.style.setProperty('--primary-color-rgb', `${parseInt(currentTheme.primary.slice(1, 3), 16)}, ${parseInt(currentTheme.primary.slice(3, 5), 16)}, ${parseInt(currentTheme.primary.slice(5, 7), 16)}`);
    root.style.setProperty('--secondary-color', currentTheme.secondary);
    root.style.setProperty('--background-color', currentTheme.background);
    root.style.setProperty('--text-color', currentTheme.text);
    root.style.setProperty('--sidebar-color', currentTheme.sidebar);
    root.style.setProperty('--accent-color', currentTheme.accent);
    root.style.setProperty('--success-color', currentTheme.success);
    root.style.setProperty('--error-color', currentTheme.error);
    root.style.setProperty('--warning-color', currentTheme.warning);
    root.style.setProperty('--info-color', currentTheme.info);
    
    // Set hover background color - lighter for light themes, darker for dark themes
    const isLightTheme = isThemeLight(currentTheme);
    const hoverBg = isLightTheme ? 'rgba(60, 64, 67, 0.08)' : 'rgba(232, 234, 237, 0.08)';
    root.style.setProperty('--hover-bg-color', hoverBg);
    
    // Set border color
    const borderColor = isLightTheme ? '#dadce0' : 'rgba(255, 255, 255, 0.1)';
    root.style.setProperty('--border-color', borderColor);

    // Also set dark/light theme for compatibility
    if (isDarkTheme) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  }, [isDarkTheme, currentTheme]);

  const toggleTheme = () => {
    // Simple toggle between light and dark themes
    setIsDarkTheme(!isDarkTheme);
  };

  const createChat = () => {
    const newChatId = `chat_${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      summary: "Start a new conversation",
      date: new Date().toLocaleDateString(),
      messages: [],
      lastUpdated: Date.now(),
      isStarred: false,
    };

    DbService.saveChat(newChat);
    setChats([newChat, ...chats]);
    setActiveChat(newChatId);
    return newChatId;
  };

  const selectChat = (chatId: string) => {
    setActiveChat(chatId);
    setCurrentView("chat");
  };

  const updateChatSummary = (chatId: string, summary: string): boolean => {
    try {
      console.log(`Updating summary for chat ${chatId} to "${summary}"`);

      // First get chat from DB to ensure we have the latest version
      const latestChat = DbService.getChat(chatId);
      if (!latestChat) {
        console.error(`Chat ${chatId} not found when updating summary`);
        return false;
      }

      // Make sure we're not losing messages
      if (!latestChat.messages || latestChat.messages.length === 0) {
        const stateChat = chats.find((c) => c.id === chatId);
        if (stateChat && stateChat.messages && stateChat.messages.length > 0) {
          console.warn(
            `DB chat has no messages but state chat has ${stateChat.messages.length} messages - using state chat`
          );
          // Use the state chat instead as it has messages
          const updatedChat = { ...stateChat, summary };
          const success = DbService.saveChat(updatedChat);

          if (success) {
            setChats(chats.map((c) => (c.id === chatId ? updatedChat : c)));
            return true;
          } else {
            console.error(`Failed to save chat with updated summary`);
            return false;
          }
        }
      }

      // Normal case - we have a valid chat with messages
      const updatedChat = { ...latestChat, summary };

      // Save to DB first
      const success = DbService.saveChat(updatedChat);

      if (success) {
        // Then update state
        setChats((prevChats) =>
          prevChats.map((c) => (c.id === chatId ? updatedChat : c))
        );
        return true;
      } else {
        console.error(`Failed to save chat with updated summary`);
        return false;
      }
    } catch (error) {
      console.error(`Error updating chat summary:`, error);
      return false;
    }
  };

  // Add a message to chat
  const addMessageToChat = (chatId: string, message: ChatMessage) => {
    try {
      // First try to get existing chat
      const existingChat = DbService.getChat(chatId);
      if (!existingChat) {
        console.error(
          `Chat ${chatId} not found when adding message ${message.id}`
        );
        return null;
      }

      // Update the chat in memory first
      const updatedChat = {
        ...existingChat,
        messages: [...existingChat.messages, message],
        lastUpdated: Date.now(),
      };

      // Update state immediately to avoid race conditions
      setChats((prevChats) => {
        return prevChats.map((c) => (c.id === chatId ? updatedChat : c));
      });

      // Then save to database
      const result = DbService.addMessageToChat(chatId, message);

      // Return the updated chat
      return result;
    } catch (error) {
      console.error(`Error adding message to chat ${chatId}:`, error);
      // Refresh from database in case of error
      setChats(DbService.getChats());
      return null;
    }
  };

  // Get a specific chat
  const getChat = (chatId: string): Chat | null => {
    return DbService.getChat(chatId);
  };

  // Update an entire chat
  const updateChat = (chat: Chat): boolean => {
    try {
      if (!chat || !chat.id) {
        console.error("Cannot update chat with invalid ID");
        return false;
      }

      // First update local state directly using the chat object
      setChats((prevChats) => {
        // Avoid unnecessary rerenders by checking if the chat object is different
        const chatIndex = prevChats.findIndex((c) => c.id === chat.id);

        if (chatIndex === -1) {
          // Chat not found in state, add it
          return [chat, ...prevChats.filter((c) => c.id !== chat.id)];
        } else {
          // Replace the chat in state
          return prevChats.map((c) => (c.id === chat.id ? chat : c));
        }
      });

      // Then save to database
      const saveResult = DbService.saveChat(chat);

      if (!saveResult) {
        console.error(`Failed to save chat ${chat.id} to database`);
        // In case of error, refresh from DB to ensure consistency
        setChats(DbService.getChats());
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating chat:", error);
      // In case of error, refresh from DB to ensure consistency
      setChats(DbService.getChats());
      return false;
    }
  };
  
  // Update chat summary
  const updateChatSummaryManual = (chatId: string, summary: string): boolean => {
    try {
      // Get the chat from database
      const chat = DbService.getChat(chatId);
      if (!chat) {
        console.error(`Chat ${chatId} not found when updating summary manually`);
        return false;
      }
      
      // Update the summary
      const updatedChat = { ...chat, summary };
      
      // Save to database and update state
      return updateChat(updatedChat);
    } catch (error) {
      console.error(`Error updating chat summary manually:`, error);
      return false;
    }
  };

  // Get a specific model
  const getModel = (modelId: string): Model | null => {
    return DbService.getModel(modelId);
  };

  // Add a new model
  const addModel = (model: Omit<Model, "id">) => {
    const newModel = DbService.addModel(model);
    setModels([...models, newModel]);
    return newModel;
  };

  // Update an existing model
  const updateModel = (model: Partial<Model> & { id: string }) => {
    const updatedModel = DbService.updateModel(model);
    if (updatedModel) {
      setModels(models.map((m) => (m.id === model.id ? updatedModel : m)));
    }
    return updatedModel;
  };

  // Delete a model
  const deleteModel = (modelId: string) => {
    DbService.deleteModel(modelId);
    setModels(models.filter((model) => model.id !== modelId));

    // If this was the summary model, clear the summary model ID
    if (summaryModelId === modelId) {
      localStorage.removeItem("summaryModelId");
      setSummaryModelId(null);
    }
  };

  // Update system prompt
  const updateSystemPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    localStorage.setItem("systemPrompt", prompt);
  };

  // Update conversation mode
  const updateConversationMode = (mode: ConversationModeType) => {
    setConversationMode(mode);
    localStorage.setItem("conversationMode", mode);
  };

  // Add a custom configuration
  const addCustomConfig = (
    config: Omit<CustomConfig, "id"> & { id?: string }
  ) => {
    const newConfig: CustomConfig = {
      id: config.id || `config_${Date.now()}`,
      name: config.name,
      description: config.description,
      rules: config.rules,
    };

    setCustomConfigs([...customConfigs, newConfig]);
    localStorage.setItem(
      "customConfigs",
      JSON.stringify([...customConfigs, newConfig])
    );
    return newConfig;
  };

  // Update a custom configuration
  const updateCustomConfig = (
    config: Partial<CustomConfig> & { id: string }
  ) => {
    const existingConfigIndex = customConfigs.findIndex(
      (c) => c.id === config.id
    );

    if (existingConfigIndex !== -1) {
      const updatedConfigs = [...customConfigs];
      updatedConfigs[existingConfigIndex] = {
        ...updatedConfigs[existingConfigIndex],
        ...config,
      };

      setCustomConfigs(updatedConfigs);
      localStorage.setItem("customConfigs", JSON.stringify(updatedConfigs));
      return updatedConfigs[existingConfigIndex];
    }

    return null;
  };

  // Delete a custom configuration
  const deleteCustomConfig = (configId: string) => {
    const updatedConfigs = customConfigs.filter(
      (config) => config.id !== configId
    );
    setCustomConfigs(updatedConfigs);
    localStorage.setItem("customConfigs", JSON.stringify(updatedConfigs));
  };

  // No longer used - function has been replaced by callLLMApi in Chat.tsx

    // Star a chat
  const starChat = (chatId: string) => {
    try {
      const chat = DbService.getChat(chatId);
      if (!chat) {
        console.error(`Chat ${chatId} not found when starring`);
        return false;
      }

      const updatedChat = {
        ...chat,
        isStarred: true
      };

      const success = DbService.saveChat(updatedChat);
      if (success) {
        setChats(chats.map(c => c.id === chatId ? updatedChat : c));
        return true;
      } else {
        console.error(`Failed to star chat ${chatId}`);
        return false;
      }
    } catch (error) {
      console.error(`Error starring chat ${chatId}:`, error);
      return false;
    }
  };

  // Unstar a chat
  const unstarChat = (chatId: string) => {
    try {
      const chat = DbService.getChat(chatId);
      if (!chat) {
        console.error(`Chat ${chatId} not found when unstarring`);
        return false;
      }

      const updatedChat = {
        ...chat,
        isStarred: false
      };

      const success = DbService.saveChat(updatedChat);
      if (success) {
        setChats(chats.map(c => c.id === chatId ? updatedChat : c));
        return true;
      } else {
        console.error(`Failed to unstar chat ${chatId}`);
        return false;
      }
    } catch (error) {
      console.error(`Error unstarring chat ${chatId}:`, error);
      return false;
    }
  };

  // Delete a chat
  const deleteChat = (chatId: string) => {
    try {
      // If this is the active chat, select another chat
      if (activeChat === chatId) {
        const otherChats = chats.filter(c => c.id !== chatId);
        if (otherChats.length > 0) {
          setActiveChat(otherChats[0].id);
        } else {
          setActiveChat(null);
        }
      }

      // Remove from database
      DbService.deleteChat(chatId);
      
      // Update state
      setChats(chats.filter(c => c.id !== chatId));
      return true;
    } catch (error) {
      console.error(`Error deleting chat ${chatId}:`, error);
      return false;
    }
  };
  
  // Delete all chats
  const deleteAllChats = () => {
    try {
      // Clear active chat
      setActiveChat(null);
      
      // Remove all chats from database
      chats.forEach(chat => {
        DbService.deleteChat(chat.id);
      });
      
      // Update state
      setChats([]);
      return true;
    } catch (error) {
      console.error('Error deleting all chats:', error);
      return false;
    }
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
    updateChatSummaryManual,
    starChat,
    unstarChat,
    deleteChat,
    deleteAllChats,

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
    deleteCustomConfig,
  };

  // @ts-ignore
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
