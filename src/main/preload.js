// Preload script
// This file is loaded before the renderer process starts
// and has access to both node.js and browser APIs
const { ipcRenderer } = require('electron');

// Since contextIsolation is false, we're making the ipcRenderer available directly
// We also need to expose any Node.js modules that might be needed in the renderer process
window.ipcRenderer = ipcRenderer;

// Add other Node.js modules and globals that React needs
window.process = process;
window.require = require;

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