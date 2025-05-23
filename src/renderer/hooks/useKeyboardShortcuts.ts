import { useEffect, useCallback, useRef, useState } from 'react';
import { KeyboardShortcut, CommandPaletteItem, ShortcutCategory } from '../../shared/types/shortcuts';

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const { enabled = true, preventDefault = true } = options;
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [commandPaletteItems, setCommandPaletteItems] = useState<CommandPaletteItem[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);

  // Keep shortcuts ref in sync
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Helper function to normalize key combinations
  const normalizeKeys = useCallback((keys: string[]): string => {
    return keys
      .map(key => key.toLowerCase())
      .sort()
      .join('+');
  }, []);

  // Helper function to get current pressed keys
  const getCurrentKeys = useCallback((event: KeyboardEvent): string[] => {
    const keys: string[] = [];
    
    if (event.ctrlKey) keys.push('ctrl');
    if (event.metaKey) keys.push('cmd');
    if (event.altKey) keys.push('alt');
    if (event.shiftKey) keys.push('shift');
    
    // Add the actual key
    if (event.key && event.key !== 'Control' && event.key !== 'Meta' && 
        event.key !== 'Alt' && event.key !== 'Shift') {
      keys.push(event.key.toLowerCase());
    }
    
    return keys;
  }, []);

  // Register a shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      // Remove existing shortcut with same ID
      const filtered = prev.filter(s => s.id !== shortcut.id);
      return [...filtered, shortcut];
    });
  }, []);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  // Register command palette item
  const registerCommandPaletteItem = useCallback((item: CommandPaletteItem) => {
    setCommandPaletteItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return [...filtered, item];
    });
  }, []);

  // Command palette controls
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  // Handle keydown events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const currentKeys = getCurrentKeys(event);
    const normalizedKeys = normalizeKeys(currentKeys);

    // Special handling for Ctrl+K (command palette)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openCommandPalette();
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const shortcutKeys = normalizeKeys(shortcut.keys);
      return shortcutKeys === normalizedKeys;
    });

    if (matchingShortcut) {
      if (preventDefault || matchingShortcut.preventDefault) {
        event.preventDefault();
      }
      
      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('Error executing shortcut:', error);
      }
    }
  }, [enabled, getCurrentKeys, normalizeKeys, preventDefault, openCommandPalette]);

  // Attach event listeners
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDownCapture = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]') ||
        target.closest('.md-editor') // MDEditor component
      )) {
        // Only allow Ctrl+K and Escape in input fields
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          handleKeyDown(event);
        } else if (event.key === 'Escape') {
          handleKeyDown(event);
        }
        return;
      }

      handleKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyDownCapture, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDownCapture, true);
    };
  }, [enabled, handleKeyDown]);

  return {
    shortcuts,
    commandPaletteItems,
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    registerShortcut,
    unregisterShortcut,
    registerCommandPaletteItem,
  };
};