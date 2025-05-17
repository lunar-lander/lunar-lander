import { useEffect, useState } from 'react';
import { AppConfig, ThemeConfig } from '../../main/config/config-manager';

// Import electron IPC renderer
const { ipcRenderer } = window.require('electron');

// Hook for accessing and managing app configuration
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const appConfig = await ipcRenderer.invoke('config:get');
        setConfig(appConfig);

        const theme = await ipcRenderer.invoke('config:get-current-theme');
        setCurrentTheme(theme);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Update partial config
  const updateConfig = async (partialConfig: Partial<AppConfig>) => {
    try {
      await ipcRenderer.invoke('config:update', partialConfig);
      // Refresh the config after update
      const updatedConfig = await ipcRenderer.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh theme if theme settings were updated
      if (partialConfig.theme) {
        const updatedTheme = await ipcRenderer.invoke('config:get-current-theme');
        setCurrentTheme(updatedTheme);
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
      await ipcRenderer.invoke('config:save-theme', theme);
      // Refresh the config
      const updatedConfig = await ipcRenderer.invoke('config:get');
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
      const result = await ipcRenderer.invoke('config:delete-theme', themeName);
      // Refresh the config
      const updatedConfig = await ipcRenderer.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh current theme if it changed
      const updatedTheme = await ipcRenderer.invoke('config:get-current-theme');
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
      const result = await ipcRenderer.invoke('config:set-theme', themeName);
      if (result) {
        // Get updated theme
        const updatedTheme = await ipcRenderer.invoke('config:get-current-theme');
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
      await ipcRenderer.invoke('config:toggle-system-theme', enabled);
      // Refresh the config
      const updatedConfig = await ipcRenderer.invoke('config:get');
      setConfig(updatedConfig);

      // Refresh current theme
      const updatedTheme = await ipcRenderer.invoke('config:get-current-theme');
      setCurrentTheme(updatedTheme);

      return true;
    } catch (error) {
      console.error('Failed to toggle system theme:', error);
      return false;
    }
  };

  return {
    config,
    currentTheme,
    loading,
    updateConfig,
    saveTheme,
    deleteTheme,
    setTheme,
    toggleSystemTheme
  };
}