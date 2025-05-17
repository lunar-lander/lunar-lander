import { ipcMain } from 'electron';
import { configManager, AppConfig, ThemeConfig } from './config-manager';

// Register IPC handlers for configuration
export function registerConfigIpcHandlers(): void {
  // Get the entire config
  ipcMain.handle('config:get', () => {
    return configManager.getConfig();
  });

  // Update config with partial config
  ipcMain.handle('config:update', (_, partialConfig: Partial<AppConfig>) => {
    configManager.updateConfig(partialConfig);
    return true;
  });

  // Get current theme
  ipcMain.handle('config:get-current-theme', () => {
    return configManager.getCurrentTheme();
  });

  // Save custom theme
  ipcMain.handle('config:save-theme', (_, theme: ThemeConfig) => {
    configManager.saveCustomTheme(theme);
    return true;
  });

  // Delete custom theme
  ipcMain.handle('config:delete-theme', (_, themeName: string) => {
    return configManager.deleteCustomTheme(themeName);
  });

  // Set current theme
  ipcMain.handle('config:set-theme', (_, themeName: string) => {
    return configManager.setCurrentTheme(themeName);
  });

  // Toggle system theme
  ipcMain.handle('config:toggle-system-theme', (_, enabled: boolean) => {
    configManager.toggleSystemTheme(enabled);
    return true;
  });
  
  // Set summary model ID
  ipcMain.handle('config:set-summary-model', (_, modelId: string) => {
    const config = configManager.getConfig();
    configManager.updateConfig({
      chat: {
        ...config.chat,
        summaryModelId: modelId
      }
    });
    return true;
  });

  // Get summary model ID
  ipcMain.handle('config:get-summary-model', () => {
    const config = configManager.getConfig();
    return config.chat.summaryModelId;
  });
}

// Function to unregister all handlers (useful for cleanup)
export function unregisterConfigIpcHandlers(): void {
  ipcMain.removeHandler('config:get');
  ipcMain.removeHandler('config:update');
  ipcMain.removeHandler('config:get-current-theme');
  ipcMain.removeHandler('config:save-theme');
  ipcMain.removeHandler('config:delete-theme');
  ipcMain.removeHandler('config:set-theme');
  ipcMain.removeHandler('config:toggle-system-theme');
  ipcMain.removeHandler('config:set-summary-model');
  ipcMain.removeHandler('config:get-summary-model');
}