import React, { createContext, useContext, useEffect } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAppContext } from './AppContext';
import { ShortcutCategory, CommandPaletteItem } from '../../shared/types/shortcuts';
import CommandPalette from '../components/CommandPalette/CommandPalette';
import { ChatMode } from '../components/Chat/ChatInput';

interface ShortcutsContextType {
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export const useShortcuts = () => {
  const context = useContext(ShortcutsContext);
  if (context === undefined) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
};

export const ShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    registerShortcut,
    registerCommandPaletteItem,
    commandPaletteItems,
  } = useKeyboardShortcuts();

  const {
    createChat,
    setCurrentView,
    currentView,
    chats,
    activeChat,
    selectChat,
    models,
    updateModel,
    deleteChat,
    starChat,
    unstarChat,
    toggleTheme,
    deleteAllChats,
  } = useAppContext();

  // Register all shortcuts and command palette items
  useEffect(() => {
    // Chat shortcuts
    registerShortcut({
      id: 'new-chat',
      keys: ['ctrl', 'n'],
      description: 'Create new chat',
      category: ShortcutCategory.CHAT,
      action: () => {
        createChat();
        setCurrentView('chat');
      },
    });

    registerCommandPaletteItem({
      id: 'new-chat',
      label: 'New Chat',
      description: 'Create a new conversation',
      category: ShortcutCategory.CHAT,
      action: () => {
        createChat();
        setCurrentView('chat');
      },
      shortcut: ['ctrl', 'n'],
      keywords: ['create', 'conversation'],
    });

    // Navigation shortcuts
    registerShortcut({
      id: 'toggle-settings',
      keys: ['ctrl', ','],
      description: 'Toggle settings',
      category: ShortcutCategory.NAVIGATION,
      action: () => {
        setCurrentView(currentView === 'settings' ? 'chat' : 'settings');
      },
    });

    registerCommandPaletteItem({
      id: 'toggle-settings',
      label: 'Toggle Settings',
      description: 'Switch between chat and settings view',
      category: ShortcutCategory.NAVIGATION,
      action: () => {
        setCurrentView(currentView === 'settings' ? 'chat' : 'settings');
      },
      shortcut: ['ctrl', ','],
      keywords: ['preferences', 'config'],
    });

    registerShortcut({
      id: 'go-to-chat',
      keys: ['ctrl', '1'],
      description: 'Go to chat view',
      category: ShortcutCategory.NAVIGATION,
      action: () => setCurrentView('chat'),
    });

    registerCommandPaletteItem({
      id: 'go-to-chat',
      label: 'Go to Chat',
      description: 'Switch to chat view',
      category: ShortcutCategory.NAVIGATION,
      action: () => setCurrentView('chat'),
      shortcut: ['ctrl', '1'],
    });

    registerShortcut({
      id: 'go-to-settings',
      keys: ['ctrl', '2'],
      description: 'Go to settings view',
      category: ShortcutCategory.NAVIGATION,
      action: () => setCurrentView('settings'),
    });

    registerCommandPaletteItem({
      id: 'go-to-settings',
      label: 'Go to Settings',
      description: 'Switch to settings view',
      category: ShortcutCategory.NAVIGATION,
      action: () => setCurrentView('settings'),
      shortcut: ['ctrl', '2'],
    });

    // Theme shortcut
    registerShortcut({
      id: 'toggle-theme',
      keys: ['ctrl', 'shift', 't'],
      description: 'Toggle theme',
      category: ShortcutCategory.SYSTEM,
      action: toggleTheme,
    });

    registerCommandPaletteItem({
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      category: ShortcutCategory.SYSTEM,
      action: toggleTheme,
      shortcut: ['ctrl', 'shift', 't'],
      keywords: ['dark', 'light', 'appearance'],
    });

    // Chat navigation shortcuts (if we have chats)
    if (chats.length > 0) {
      registerShortcut({
        id: 'next-chat',
        keys: ['ctrl', 'shift', 'arrowdown'],
        description: 'Next chat',
        category: ShortcutCategory.CHAT,
        action: () => {
          const currentIndex = chats.findIndex(chat => chat.id === activeChat);
          const nextIndex = (currentIndex + 1) % chats.length;
          selectChat(chats[nextIndex].id);
        },
      });

      registerShortcut({
        id: 'prev-chat',
        keys: ['ctrl', 'shift', 'arrowup'],
        description: 'Previous chat',
        category: ShortcutCategory.CHAT,
        action: () => {
          const currentIndex = chats.findIndex(chat => chat.id === activeChat);
          const prevIndex = currentIndex <= 0 ? chats.length - 1 : currentIndex - 1;
          selectChat(chats[prevIndex].id);
        },
      });

      // Recent chats in command palette
      const recentChats = chats.slice(0, 10);
      recentChats.forEach((chat, index) => {
        registerCommandPaletteItem({
          id: `select-chat-${chat.id}`,
          label: chat.summary !== "Start a new conversation" ? chat.summary : "New conversation",
          description: `Go to chat from ${new Date(chat.lastUpdated).toLocaleDateString()}`,
          category: ShortcutCategory.CHAT,
          action: () => {
            selectChat(chat.id);
            setCurrentView('chat');
          },
          keywords: ['chat', 'conversation', 'switch'],
        });
      });
    }

    // Model shortcuts
    models.forEach((model, index) => {
      if (index < 9) { // Only first 9 models get number shortcuts
        registerShortcut({
          id: `toggle-model-${model.id}`,
          keys: ['alt', `${index + 1}`],
          description: `Toggle ${model.name}`,
          category: ShortcutCategory.MODELS,
          action: () => updateModel({ id: model.id, isActive: !model.isActive }),
        });
      }

      registerCommandPaletteItem({
        id: `toggle-model-${model.id}`,
        label: `Toggle ${model.name}`,
        description: `${model.isActive ? 'Deactivate' : 'Activate'} ${model.name}`,
        category: ShortcutCategory.MODELS,
        action: () => updateModel({ id: model.id, isActive: !model.isActive }),
        shortcut: index < 9 ? ['alt', `${index + 1}`] : undefined,
        keywords: ['model', 'ai', 'toggle', model.name.toLowerCase()],
      });
    });

    // Chat management commands
    if (activeChat) {
      const currentChat = chats.find(c => c.id === activeChat);
      if (currentChat) {
        registerCommandPaletteItem({
          id: 'star-current-chat',
          label: currentChat.isStarred ? 'Unstar Current Chat' : 'Star Current Chat',
          description: currentChat.isStarred ? 'Remove star from current conversation' : 'Star current conversation',
          category: ShortcutCategory.CHAT,
          action: () => {
            if (currentChat.isStarred) {
              unstarChat(activeChat);
            } else {
              starChat(activeChat);
            }
          },
          keywords: ['star', 'favorite', 'bookmark'],
        });

        registerCommandPaletteItem({
          id: 'delete-current-chat',
          label: 'Delete Current Chat',
          description: 'Delete the current conversation',
          category: ShortcutCategory.CHAT,
          action: () => {
            if (window.confirm('Are you sure you want to delete this conversation?')) {
              deleteChat(activeChat);
            }
          },
          keywords: ['delete', 'remove', 'trash'],
        });
      }
    }

    // Bulk operations
    if (chats.length > 0) {
      registerCommandPaletteItem({
        id: 'delete-all-chats',
        label: 'Delete All Chats',
        description: 'Delete all conversations (cannot be undone)',
        category: ShortcutCategory.CHAT,
        action: () => {
          if (window.confirm('Are you sure you want to delete ALL conversations? This cannot be undone.')) {
            deleteAllChats();
          }
        },
        keywords: ['clear', 'delete', 'all', 'conversations'],
      });
    }

    // Enable/disable all models
    if (models.length > 0) {
      const hasActiveModels = models.some(m => m.isActive);
      const hasInactiveModels = models.some(m => !m.isActive);

      if (hasActiveModels) {
        registerCommandPaletteItem({
          id: 'disable-all-models',
          label: 'Disable All Models',
          description: 'Deactivate all models',
          category: ShortcutCategory.MODELS,
          action: () => {
            models.forEach(model => {
              if (model.isActive) {
                updateModel({ id: model.id, isActive: false });
              }
            });
          },
          keywords: ['disable', 'deactivate', 'all', 'models'],
        });
      }

      if (hasInactiveModels) {
        registerCommandPaletteItem({
          id: 'enable-all-models',
          label: 'Enable All Models',
          description: 'Activate all models',
          category: ShortcutCategory.MODELS,
          action: () => {
            models.forEach(model => {
              if (!model.isActive) {
                updateModel({ id: model.id, isActive: true });
              }
            });
          },
          keywords: ['enable', 'activate', 'all', 'models'],
        });
      }
    }

  }, [
    registerShortcut,
    registerCommandPaletteItem,
    createChat,
    setCurrentView,
    currentView,
    chats,
    activeChat,
    selectChat,
    models,
    updateModel,
    deleteChat,
    starChat,
    unstarChat,
    toggleTheme,
    deleteAllChats,
  ]);

  const value = {
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
  };

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        items={commandPaletteItems}
      />
    </ShortcutsContext.Provider>
  );
};