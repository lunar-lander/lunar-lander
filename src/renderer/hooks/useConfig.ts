import { useEffect, useState } from 'react';
import { electron } from '../services/ipc';

// TypeScript types for configuration
interface ThemeConfig {
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

interface AppConfig {
  theme: {
    current: string;
    custom: ThemeConfig[];
    system: boolean;
  };
  ui: {
    fontSize: number;
    fontFamily: string;
    messageBubbleStyle: string;
    showTimestamps: boolean;
    compactMode: boolean;
    sidebarWidth: number;
    zoomLevel: number;
  };
  behavior: {
    sendOnEnter: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    confirmClearConversation: boolean;
    notificationsEnabled: boolean;
    maxMessagesPerConversation: number;
  };
  privacy: {
    saveHistory: boolean;
    anonymizeData: boolean;
  };
  advanced: {
    logLevel: string;
    useGPU: boolean;
    proxyUrl: string;
    maxConcurrentRequests: number;
  };
  chat: {
    summaryModelId: string | null;
  };
}

// Hook for accessing and managing app configuration
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryModelId, setSummaryModelId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Load initial config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const appConfig = await electron.invoke('config:get');
        setConfig(appConfig);

        const theme = await electron.invoke('config:get-current-theme');
        setCurrentTheme(theme);

        // Get summary model ID
        const summaryModel = await electron.invoke('config:get-summary-model');
        setSummaryModelId(summaryModel);
        
        // Get zoom level
        const currentZoom = await electron.invoke('config:get-zoom-level');
        setZoomLevel(currentZoom);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // This section was replaced by the useEffect above

  // Update partial config
  const updateConfig = async (partialConfig: Partial<AppConfig>) => {
    try {
      await electron.invoke('config:update', partialConfig);
      // Refresh the config after update
      const updatedConfig = await electron.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh theme if theme settings were updated
      if (partialConfig.theme) {
        const updatedTheme = await electron.invoke('config:get-current-theme');
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
    try {
      await electron.invoke('config:save-theme', theme);
      // Refresh the config
      const updatedConfig = await electron.invoke('config:get');
      setConfig(updatedConfig);
      return true;
    } catch (error) {
      console.error('Failed to save theme:', error);
      return false;
    }
  };

  // Delete custom theme
  const deleteTheme = async (themeName: string) => {
    try {
      const result = await electron.invoke('config:delete-theme', themeName);
      // Refresh the config
      const updatedConfig = await electron.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh current theme if it changed
      const updatedTheme = await electron.invoke('config:get-current-theme');
      setCurrentTheme(updatedTheme);

      return result;
    } catch (error) {
      console.error('Failed to delete theme:', error);
      return false;
    }
  };

  // Set current theme
  const setTheme = async (themeName: string) => {
    try {
      const result = await electron.invoke('config:set-theme', themeName);
      if (result) {
        // Get updated theme
        const updatedTheme = await electron.invoke('config:get-current-theme');
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
    try {
      await electron.invoke('config:toggle-system-theme', enabled);
      // Refresh the config
      const updatedConfig = await electron.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh current theme
      const updatedTheme = await electron.invoke('config:get-current-theme');
      setCurrentTheme(updatedTheme);

      return true;
    } catch (error) {
      console.error('Failed to toggle system theme:', error);
      return false;
    }
  };

  // Set summary model ID
  const setSummaryModel = async (modelId: string) => {
    try {
      await electron.invoke('config:set-summary-model', modelId);
      setSummaryModelId(modelId);
      return true;
    } catch (error) {
      console.error('Failed to set summary model:', error);
      return false;
    }
  };
  
  // Set zoom level
  const setZoom = async (newZoomLevel: number) => {
    try {
      // Ensure zoom level is between 0.5 and 2.0
      const clampedZoom = Math.max(0.5, Math.min(2.0, newZoomLevel));
      
      await electron.invoke('config:set-zoom-level', clampedZoom);
      setZoomLevel(clampedZoom);
      
      // Apply zoom level to the document root
      document.documentElement.style.setProperty('--zoom-level', clampedZoom.toString());
      
      // Force layout recalculation
      window.dispatchEvent(new Event('resize'));
      
      return true;
    } catch (error) {
      console.error('Failed to set zoom level:', error);
      return false;
    }
  };

  // Apply zoom level effect whenever it changes
  useEffect(() => {
    if (zoomLevel) {
      document.documentElement.style.setProperty('--zoom-level', zoomLevel.toString());
    }
  }, [zoomLevel]);

  return {
    config,
    currentTheme,
    loading,
    summaryModelId,
    zoomLevel,
    updateConfig,
    saveTheme,
    deleteTheme,
    setTheme,
    toggleSystemTheme,
    setSummaryModel,
    setZoom
  };
}