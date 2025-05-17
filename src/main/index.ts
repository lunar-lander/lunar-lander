import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerConfigIpcHandlers } from './config/ipc-handlers';
import { modelManager } from './models/index';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for preload script to work properly
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000/index.html');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
  
  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // Register all IPC handlers for configuration
  registerConfigIpcHandlers();
  
  // Register model-related IPC handlers
  registerModelIpcHandlers();
  
  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Register model-related IPC handlers
function registerModelIpcHandlers(): void {
  // Get a list of models
  ipcMain.handle('models:get-all', () => {
    return modelManager.getAllModels();
  });

  // Get active models
  ipcMain.handle('models:get-active', () => {
    return modelManager.getActiveModels();
  });

  // Add a new model
  ipcMain.handle('models:add', (_, model) => {
    return modelManager.addModel(model);
  });

  // Update a model
  ipcMain.handle('models:update', (_, id, updates) => {
    return modelManager.updateModel(id, updates);
  });

  // Delete a model
  ipcMain.handle('models:delete', (_, id) => {
    return modelManager.deleteModel(id);
  });

  // Toggle model active status
  ipcMain.handle('models:toggle-active', (_, id) => {
    return modelManager.toggleModelActive(id);
  });
}