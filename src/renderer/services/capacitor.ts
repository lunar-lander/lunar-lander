/**
 * Capacitor compatibility layer for mobile platforms
 * Replaces Electron IPC with Capacitor Preferences and other mobile APIs
 */

import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';

// Platform detection
export const isCapacitor = () => {
  return !!(window as any).Capacitor;
};

export const isMobile = () => {
  return isCapacitor();
};

// Default configurations
const defaultAppConfig = {
  theme: {
    current: 'dark',
    custom: [],
    system: false
  },
  ui: {
    fontSize: 14,
    fontFamily: 'system-ui',
    messageBubbleStyle: 'rounded',
    showTimestamps: true,
    compactMode: false,
    sidebarWidth: 280,
    inputHeight: 150,
    zoomLevel: 1.0
  },
  behavior: {
    sendOnEnter: false,
    autoSave: true,
    autoSaveInterval: 30000,
    confirmClearConversation: true,
    notificationsEnabled: true,
    maxMessagesPerConversation: 100
  },
  privacy: {
    saveHistory: true,
    anonymizeData: false
  },
  advanced: {
    logLevel: 'info',
    useGPU: false,
    proxyUrl: '',
    maxConcurrentRequests: 3
  },
  chat: {
    summaryModelId: null
  }
};

const defaultThemes = {
  light: {
    name: 'light',
    primary: '#007acc',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#333333',
    sidebar: '#f8f9fa',
    accent: '#007acc',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  },
  dark: {
    name: 'dark',
    primary: '#007acc',
    secondary: '#6c757d',
    background: '#1a1a1a',
    text: '#ffffff',
    sidebar: '#2d2d2d',
    accent: '#007acc',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  }
};

export const defaultModels = [
  {
    id: '1',
    name: 'GPT-4',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4',
    apiKey: '',
    isActive: false,
    provider: 'openai'
  },
  {
    id: '2',
    name: 'Claude 3.5 Sonnet',
    baseUrl: 'https://api.anthropic.com',
    modelName: 'claude-3-5-sonnet-20241022',
    apiKey: '',
    isActive: false,
    provider: 'anthropic'
  }
];

// Capacitor-based storage implementation
export const capacitorStorage = {
  // Configuration methods
  async getConfig() {
    try {
      const { value } = await Preferences.get({ key: 'appConfig' });
      if (value) {
        return { ...defaultAppConfig, ...JSON.parse(value) };
      }
      return defaultAppConfig;
    } catch (error) {
      console.error('Failed to get config:', error);
      return defaultAppConfig;
    }
  },

  async updateConfig(partialConfig: any) {
    try {
      const currentConfig = await this.getConfig();
      const updatedConfig = { ...currentConfig, ...partialConfig };
      await Preferences.set({
        key: 'appConfig',
        value: JSON.stringify(updatedConfig)
      });
      return updatedConfig;
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  },

  async getCurrentTheme() {
    try {
      const config = await this.getConfig();
      const themeName = config.theme.current;
      
      // Check custom themes first
      const customTheme = config.theme.custom.find((t: any) => t.name === themeName);
      if (customTheme) {
        return customTheme;
      }
      
      // Fall back to default themes
      return defaultThemes[themeName as keyof typeof defaultThemes] || defaultThemes.dark;
    } catch (error) {
      console.error('Failed to get current theme:', error);
      return defaultThemes.dark;
    }
  },

  async saveTheme(theme: any) {
    try {
      const config = await this.getConfig();
      const customThemes = config.theme.custom || [];
      const existingIndex = customThemes.findIndex((t: any) => t.name === theme.name);
      
      if (existingIndex >= 0) {
        customThemes[existingIndex] = theme;
      } else {
        customThemes.push(theme);
      }
      
      await this.updateConfig({
        theme: {
          ...config.theme,
          custom: customThemes
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to save theme:', error);
      return false;
    }
  },

  async deleteTheme(themeName: string) {
    try {
      const config = await this.getConfig();
      const customThemes = config.theme.custom.filter((t: any) => t.name !== themeName);
      
      await this.updateConfig({
        theme: {
          ...config.theme,
          custom: customThemes,
          current: config.theme.current === themeName ? 'dark' : config.theme.current
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete theme:', error);
      return false;
    }
  },

  async setTheme(themeName: string) {
    try {
      await this.updateConfig({
        theme: {
          ...(await this.getConfig()).theme,
          current: themeName
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to set theme:', error);
      return false;
    }
  },

  async toggleSystemTheme(enabled: boolean) {
    try {
      const config = await this.getConfig();
      await this.updateConfig({
        theme: {
          ...config.theme,
          system: enabled
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to toggle system theme:', error);
      return false;
    }
  },

  async setSummaryModel(modelId: string) {
    try {
      await this.updateConfig({
        chat: {
          summaryModelId: modelId
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to set summary model:', error);
      return false;
    }
  },

  async getSummaryModel() {
    try {
      const config = await this.getConfig();
      return config.chat.summaryModelId;
    } catch (error) {
      console.error('Failed to get summary model:', error);
      return null;
    }
  },

  async setZoomLevel(zoomLevel: number) {
    try {
      const config = await this.getConfig();
      await this.updateConfig({
        ui: {
          ...config.ui,
          zoomLevel
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to set zoom level:', error);
      return false;
    }
  },

  async getZoomLevel() {
    try {
      const config = await this.getConfig();
      return config.ui.zoomLevel || 1.0;
    } catch (error) {
      console.error('Failed to get zoom level:', error);
      return 1.0;
    }
  },

  // Model management methods
  async getAllModels() {
    try {
      const { value } = await Preferences.get({ key: 'models' });
      if (value) {
        return JSON.parse(value);
      }
      // Initialize with default models if none exist
      await Preferences.set({
        key: 'models',
        value: JSON.stringify(defaultModels)
      });
      return defaultModels;
    } catch (error) {
      console.error('Failed to get models:', error);
      return defaultModels;
    }
  },

  async getActiveModels() {
    try {
      const models = await this.getAllModels();
      return models.filter((model: any) => model.isActive);
    } catch (error) {
      console.error('Failed to get active models:', error);
      return [];
    }
  },

  async addModel(model: any) {
    try {
      const models = await this.getAllModels();
      const newModel = {
        ...model,
        id: Date.now().toString()
      };
      models.push(newModel);
      await Preferences.set({
        key: 'models',
        value: JSON.stringify(models)
      });
      return newModel;
    } catch (error) {
      console.error('Failed to add model:', error);
      throw error;
    }
  },

  async updateModel(id: string, updates: any) {
    try {
      const models = await this.getAllModels();
      const modelIndex = models.findIndex((m: any) => m.id === id);
      if (modelIndex >= 0) {
        models[modelIndex] = { ...models[modelIndex], ...updates };
        await Preferences.set({
          key: 'models',
          value: JSON.stringify(models)
        });
        return models[modelIndex];
      }
      throw new Error('Model not found');
    } catch (error) {
      console.error('Failed to update model:', error);
      throw error;
    }
  },

  async deleteModel(id: string) {
    try {
      const models = await this.getAllModels();
      const filteredModels = models.filter((m: any) => m.id !== id);
      await Preferences.set({
        key: 'models',
        value: JSON.stringify(filteredModels)
      });
      return true;
    } catch (error) {
      console.error('Failed to delete model:', error);
      return false;
    }
  },

  async toggleModelActive(id: string) {
    try {
      const models = await this.getAllModels();
      const model = models.find((m: any) => m.id === id);
      if (model) {
        model.isActive = !model.isActive;
        await Preferences.set({
          key: 'models',
          value: JSON.stringify(models)
        });
        return model;
      }
      throw new Error('Model not found');
    } catch (error) {
      console.error('Failed to toggle model active:', error);
      throw error;
    }
  }
};

// Unified API that works with both Electron and Capacitor
export const electron = {
  invoke: async (channel: string, ...args: any[]) => {
    // If running in Capacitor (mobile), use capacitorStorage
    if (isCapacitor()) {
      switch (channel) {
        case 'config:get':
          return capacitorStorage.getConfig();
        case 'config:update':
          return capacitorStorage.updateConfig(args[0]);
        case 'config:get-current-theme':
          return capacitorStorage.getCurrentTheme();
        case 'config:save-theme':
          return capacitorStorage.saveTheme(args[0]);
        case 'config:delete-theme':
          return capacitorStorage.deleteTheme(args[0]);
        case 'config:set-theme':
          return capacitorStorage.setTheme(args[0]);
        case 'config:toggle-system-theme':
          return capacitorStorage.toggleSystemTheme(args[0]);
        case 'config:set-summary-model':
          return capacitorStorage.setSummaryModel(args[0]);
        case 'config:get-summary-model':
          return capacitorStorage.getSummaryModel();
        case 'config:set-zoom-level':
          return capacitorStorage.setZoomLevel(args[0]);
        case 'config:get-zoom-level':
          return capacitorStorage.getZoomLevel();
        case 'models:get-all':
          return capacitorStorage.getAllModels();
        case 'models:get-active':
          return capacitorStorage.getActiveModels();
        case 'models:add':
          return capacitorStorage.addModel(args[0]);
        case 'models:update':
          return capacitorStorage.updateModel(args[0], args[1]);
        case 'models:delete':
          return capacitorStorage.deleteModel(args[0]);
        case 'models:toggle-active':
          return capacitorStorage.toggleModelActive(args[0]);
        default:
          throw new Error(`Unsupported channel in Capacitor mode: ${channel}`);
      }
    }
    
    // If running in Electron, use the original IPC
    if ((window as any).ipcRenderer) {
      const { ipcRenderer } = window as any;
      return ipcRenderer.invoke(channel, ...args);
    }
    
    throw new Error('Neither Electron nor Capacitor environment detected');
  }
};

export default electron;