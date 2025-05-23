export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: ShortcutCategory;
  action: () => void;
  global?: boolean; // Whether shortcut works globally or only when focused
  preventDefault?: boolean; // Whether to prevent default browser behavior
}

export enum ShortcutCategory {
  CHAT = "chat",
  NAVIGATION = "navigation", 
  MODELS = "models",
  EDITING = "editing",
  SYSTEM = "system"
}

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  category: ShortcutCategory;
  action: () => void;
  shortcut?: string[];
  keywords?: string[]; // Additional search terms
}

export interface ShortcutContextValue {
  shortcuts: KeyboardShortcut[];
  commandPaletteItems: CommandPaletteItem[];
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
}