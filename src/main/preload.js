// Preload script
// This file is loaded before the renderer process starts
// and has access to both node.js and browser APIs
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process through the "electron" global
contextBridge.exposeInMainWorld('electron', {
  // Allow invoking IPC methods
  invoke: (channel, ...args) => {
    // Whitelist channels that can be invoked
    const validChannels = [
      'config:get',
      'config:update',
      'config:get-current-theme',
      'config:save-theme',
      'config:delete-theme',
      'config:set-theme',
      'config:toggle-system-theme',
      'config:set-summary-model',
      'config:get-summary-model'
    ];
    
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  }
});

// Also maintain the default DOM content loaded handler
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});