/**
 * IPC wrapper to maintain API compatibility
 * This will help maintain the original API even though we disabled contextIsolation
 */

// We can access ipcRenderer directly because contextIsolation is false
const { ipcRenderer } = window as any;

// Create a compatibility layer that matches our original API
export const electron = {
  invoke: (channel: string, ...args: any[]) => {
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
      'config:get-summary-model',
      'config:set-zoom-level',
      'config:get-zoom-level',
      'models:get-all',
      'models:get-active',
      'models:add',
      'models:update',
      'models:delete',
      'models:toggle-active'
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }

    throw new Error(`Unauthorized IPC channel: ${channel}`);
  }
};

export default electron;