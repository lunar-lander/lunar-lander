import { app } from 'electron';
import fs from 'fs';
import path from 'path';

// Define the theme interface
export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  sidebar: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

// Define the application settings interface
export interface AppConfig {
  theme: {
    current: string;
    custom: ThemeConfig[];
    system: boolean; // follow system dark/light mode
  };
  ui: {
    fontSize: number;
    fontFamily: string;
    messageBubbleStyle: 'rounded' | 'square' | 'minimal';
    showTimestamps: boolean;
    compactMode: boolean;
    sidebarWidth: number;
  };
  behavior: {
    sendOnEnter: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // in minutes
    confirmClearConversation: boolean;
    notificationsEnabled: boolean;
    maxMessagesPerConversation: number;
  };
  privacy: {
    saveHistory: boolean;
    anonymizeData: boolean;
  };
  advanced: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    useGPU: boolean;
    proxyUrl: string;
    maxConcurrentRequests: number;
  };
  chat: {
    summaryModelId: string | null; // ID of the model used for generating summaries
  };
}

// Default theme configurations
const defaultLightTheme: ThemeConfig = {
  name: 'Light',
  primary: '#1a73e8',
  secondary: '#4285f4',
  background: '#ffffff',
  text: '#202124',
  sidebar: '#f5f5f5',
  accent: '#fbbc04',
  success: '#34a853',
  error: '#ea4335',
  warning: '#fbbc04',
  info: '#4285f4'
};

const defaultDarkTheme: ThemeConfig = {
  name: 'Dark',
  primary: '#8ab4f8',
  secondary: '#4285f4',
  background: '#202124',
  text: '#e8eaed',
  sidebar: '#303134',
  accent: '#fbbc04',
  success: '#34a853',
  error: '#ea4335',
  warning: '#fbbc04',
  info: '#8ab4f8'
};

// Default application configuration
const defaultConfig: AppConfig = {
  theme: {
    current: 'Light',
    custom: [],
    system: true
  },
  ui: {
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    messageBubbleStyle: 'rounded',
    showTimestamps: true,
    compactMode: false,
    sidebarWidth: 280
  },
  behavior: {
    sendOnEnter: true,
    autoSave: true,
    autoSaveInterval: 5,
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
    useGPU: true,
    proxyUrl: '',
    maxConcurrentRequests: 3
  },
  chat: {
    summaryModelId: null
  }
};

// Configuration manager class
export class ConfigManager {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'app-config.json');
    this.config = this.loadConfig();
  }

  // Load configuration from file
  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const rawData = fs.readFileSync(this.configPath, 'utf-8');
        const loadedConfig = JSON.parse(rawData);
        // Merge with default config to ensure all properties exist
        return this.mergeConfigs(defaultConfig, loadedConfig);
      }
    } catch (error) {
      console.error('Failed to load application configuration:', error);
    }

    // Initialize with default themes if config doesn't exist
    const initialConfig = { ...defaultConfig };
    initialConfig.theme.custom = [defaultLightTheme, defaultDarkTheme];
    return initialConfig;
  }

  // Merge loaded config with default config
  private mergeConfigs(defaultCfg: AppConfig, loadedCfg: Partial<AppConfig>): AppConfig {
    // This is a simplistic deep merge
    const merged = { ...defaultCfg };
    
    for (const [key, value] of Object.entries(loadedCfg)) {
      if (key in defaultCfg) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          merged[key as keyof AppConfig] = {
            ...defaultCfg[key as keyof AppConfig],
            ...value
          } as any;
        } else {
          merged[key as keyof AppConfig] = value as any;
        }
      }
    }
    
    return merged;
  }

  // Save configuration to file
  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save application configuration:', error);
    }
  }

  // Get entire configuration
  getConfig(): AppConfig {
    return { ...this.config };
  }

  // Update part of the configuration
  updateConfig(partialConfig: Partial<AppConfig>): void {
    this.config = this.mergeConfigs(this.config, partialConfig);
    this.saveConfig();
  }

  // Get current theme
  getCurrentTheme(): ThemeConfig {
    // If system theme is enabled, should check system preference here
    // and return appropriate theme
    
    const currentThemeName = this.config.theme.current;
    
    // Find in custom themes
    const customTheme = this.config.theme.custom.find(
      theme => theme.name === currentThemeName
    );
    
    if (customTheme) {
      return customTheme;
    }
    
    // Fallback to default light theme
    return defaultLightTheme;
  }

  // Add or update a custom theme
  saveCustomTheme(theme: ThemeConfig): void {
    const index = this.config.theme.custom.findIndex(t => t.name === theme.name);
    
    if (index >= 0) {
      // Update existing theme
      this.config.theme.custom[index] = { ...theme };
    } else {
      // Add new theme
      this.config.theme.custom.push({ ...theme });
    }
    
    this.saveConfig();
  }

  // Delete a custom theme
  deleteCustomTheme(themeName: string): boolean {
    const initialLength = this.config.theme.custom.length;
    this.config.theme.custom = this.config.theme.custom.filter(t => t.name !== themeName);
    
    // If current theme was deleted, switch to default
    if (this.config.theme.current === themeName) {
      this.config.theme.current = 'Light';
    }
    
    this.saveConfig();
    return this.config.theme.custom.length !== initialLength;
  }

  // Set current theme by name
  setCurrentTheme(themeName: string): boolean {
    // Check if theme exists
    const exists = this.config.theme.custom.some(t => t.name === themeName);
    
    if (exists) {
      this.config.theme.current = themeName;
      this.saveConfig();
      return true;
    }
    
    return false;
  }

  // Toggle system theme preference
  toggleSystemTheme(enabled: boolean): void {
    this.config.theme.system = enabled;
    this.saveConfig();
  }
}

// Export singleton instance
export const configManager = new ConfigManager();