import { ipcMain, dialog } from 'electron';
import { configManager, AppConfig, ThemeConfig } from './config-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

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
  
  // Set zoom level
  ipcMain.handle('config:set-zoom-level', (_, zoomLevel: number) => {
    const config = configManager.getConfig();
    configManager.updateConfig({
      ui: {
        ...config.ui,
        zoomLevel: zoomLevel
      }
    });
    return true;
  });

  // Get zoom level
  ipcMain.handle('config:get-zoom-level', () => {
    const config = configManager.getConfig();
    return config.ui.zoomLevel;
  });

  // DSL File Management
  const dslDirectory = path.join(app.getPath('userData'), 'dsl-conversations');

  // Ensure DSL directory exists
  ipcMain.handle('ensure-dsl-directory', async () => {
    try {
      await fs.mkdir(dslDirectory, { recursive: true });
      return true;
    } catch (error) {
      console.error('Failed to create DSL directory:', error);
      throw error;
    }
  });

  // List DSL files
  ipcMain.handle('list-dsl-files', async () => {
    try {
      await fs.mkdir(dslDirectory, { recursive: true });
      const files = await fs.readdir(dslDirectory);
      return files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    } catch (error) {
      console.error('Failed to list DSL files:', error);
      return [];
    }
  });

  // Load DSL file
  ipcMain.handle('load-dsl-file', async (_, filename: string) => {
    try {
      const filePath = path.join(dslDirectory, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Failed to load DSL file:', error);
      throw error;
    }
  });

  // Save DSL file
  ipcMain.handle('save-dsl-file', async (_, filename: string, content: string) => {
    try {
      await fs.mkdir(dslDirectory, { recursive: true });
      const filePath = path.join(dslDirectory, filename);
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save DSL file:', error);
      throw error;
    }
  });

  // Delete DSL file
  ipcMain.handle('delete-dsl-file', async (_, filename: string) => {
    try {
      const filePath = path.join(dslDirectory, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete DSL file:', error);
      throw error;
    }
  });

  // Export DSL file
  ipcMain.handle('export-dsl-file', async (_, { defaultPath, content }: { defaultPath: string, content: string }) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultPath,
        filters: [
          { name: 'YAML Files', extensions: ['yaml', 'yml'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return { success: true, cancelled: true };
      }

      if (result.filePath) {
        await fs.writeFile(result.filePath, content, 'utf-8');
        return { success: true };
      }

      return { success: false, error: 'No file path selected' };
    } catch (error) {
      console.error('Failed to export DSL file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Import DSL file
  ipcMain.handle('import-dsl-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        filters: [
          { name: 'YAML Files', extensions: ['yaml', 'yml'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled) {
        return { success: true, cancelled: true };
      }

      if (result.filePaths && result.filePaths.length > 0) {
        const content = await fs.readFile(result.filePaths[0], 'utf-8');
        return { success: true, content };
      }

      return { success: false, error: 'No file selected' };
    } catch (error) {
      console.error('Failed to import DSL file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
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
  ipcMain.removeHandler('config:set-zoom-level');
  ipcMain.removeHandler('config:get-zoom-level');
}