import { useEffect, useState } from 'react';
import { AppConfig, ThemeConfig } from '../../main/config/config-manager';

// Access the electron API exposed by the preload script
declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    }
  }
}

// Hook for accessing and managing app configuration
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryModelId, setSummaryModelId] = useState<string | null>(null);
  const [electronAvailable, setElectronAvailable] = useState<boolean>(false);

  // Check if electron is available
  useEffect(() => {
    // Check if electron is available after component mounts
    const checkElectron = () => {
      if (window.electron) {
        setElectronAvailable(true);
      } else {
        console.warn('Electron API not available yet, will retry in 500ms');
        setTimeout(checkElectron, 500);
      }
    };
    
    checkElectron();
  }, []);

  // Load initial config once electron is available
  useEffect(() => {
    if (!electronAvailable) return;
    
    const loadConfig = async () => {
      try {
        const appConfig = await window.electron!.invoke('config:get');
        setConfig(appConfig);

        const theme = await window.electron!.invoke('config:get-current-theme');
        setCurrentTheme(theme);
        
        // Get summary model ID
        const summaryModel = await window.electron!.invoke('config:get-summary-model');
        setSummaryModelId(summaryModel);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [electronAvailable]);

  // Update partial config
  const updateConfig = async (partialConfig: Partial<AppConfig>) => {
    if (!window.electron) {
      console.error('Electron API not available');
      return false;
    }
    
    try {
      await window.electron.invoke('config:update', partialConfig);
      // Refresh the config after update
      const updatedConfig = await window.electron.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh theme if theme settings were updated
      if (partialConfig.theme) {
        const updatedTheme = await window.electron.invoke('config:get-current-theme');
        setCurrentTheme(updatedTheme);
      }
      
      // Refresh summary model if chat settings were updated
      if (partialConfig.chat?.summaryModelId !== undefined) {
        setSummaryModelId(partialConfig.chat.summaryModelId);
      }

      return true;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      return false;
    }
  };

  // Save custom theme
  const saveTheme = async (theme: ThemeConfig) => {
    if (!window.electron) {
      console.error('Electron API not available');
      return false;
    }
    
    try {
      await window.electron.invoke('config:save-theme', theme);
      // Refresh the config
      const updatedConfig = await window.electron.invoke('config:get');
      setConfig(updatedConfig);
      return true;
    } catch (error) {
      console.error('Failed to save theme:', error);
      return false;
    }
  };

  // Delete custom theme
  const deleteTheme = async (themeName: string) => {
    if (!window.electron) {
      console.error('Electron API not available');
      return false;
    }
    
    try {
      const result = await window.electron.invoke('config:delete-theme', themeName);
      // Refresh the config
      const updatedConfig = await window.electron.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh current theme if it changed
      const updatedTheme = await window.electron.invoke('config:get-current-theme');
      setCurrentTheme(updatedTheme);

      return result;
    } catch (error) {
      console.error('Failed to delete theme:', error);
      return false;
    }
  };

  // Set current theme
  const setTheme = async (themeName: string) => {
    if (!window.electron) {
      console.error('Electron API not available');
      return false;
    }
    
    try {
      const result = await window.electron.invoke('config:set-theme', themeName);
      if (result) {
        // Get updated theme
        const updatedTheme = await window.electron.invoke('config:get-current-theme');
        setCurrentTheme(updatedTheme);
      }
      return result;
    } catch (error) {
      console.error('Failed to set theme:', error);
      return false;
    }
  };

  // Toggle system theme
  const toggleSystemTheme = async (enabled: boolean) => {
    if (!window.electron) {
      console.error('Electron API not available');
      return false;
    }
    
    try {
      await window.electron.invoke('config:toggle-system-theme', enabled);
      // Refresh the config
      const updatedConfig = await window.electron.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh current theme
      const updatedTheme = await window.electron.invoke('config:get-current-theme');
      setCurrentTheme(updatedTheme);

      return true;
    } catch (error) {
      console.error('Failed to toggle system theme:', error);
      return false;
    }
  };
  
  // Set summary model ID
  const setSummaryModel = async (modelId: string) => {
    if (!window.electron) {
      console.error('Electron API not available');
      return false;
    }
    
    try {
      await window.electron.invoke('config:set-summary-model', modelId);
      setSummaryModelId(modelId);
      return true;
    } catch (error) {
      console.error('Failed to set summary model:', error);
      return false;
    }
  };

  return {
    config,
    currentTheme,
    loading,
    summaryModelId,
    updateConfig,
    saveTheme,
    deleteTheme,
    setTheme,
    toggleSystemTheme,
    setSummaryModel
  };
}