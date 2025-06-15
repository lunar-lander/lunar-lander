/**
 * Unified IPC wrapper that works with both Electron and Capacitor
 * Automatically detects the platform and uses the appropriate implementation
 */

import { electron as capacitorElectron, isCapacitor } from './capacitor';

// Create a compatibility layer that works across platforms
export const electron = {
  invoke: (channel: string, ...args: any[]) => {
    // If running in Capacitor (mobile), use the Capacitor implementation
    if (isCapacitor()) {
      return capacitorElectron.invoke(channel, ...args);
    }

    // If running in Electron (desktop), use the original IPC
    if ((window as any).ipcRenderer) {
      const { ipcRenderer } = window as any;
      
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

    throw new Error('Neither Electron nor Capacitor environment detected');
  }
};

export default electron;