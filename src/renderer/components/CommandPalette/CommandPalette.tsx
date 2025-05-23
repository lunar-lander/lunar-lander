import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CommandPaletteItem, ShortcutCategory } from '../../../shared/types/shortcuts';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandPaletteItem[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, items }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Filter and group items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => {
      const matchesLabel = item.label.toLowerCase().includes(searchLower);
      const matchesDescription = item.description?.toLowerCase().includes(searchLower);
      const matchesKeywords = item.keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchLower)
      );
      return matchesLabel || matchesDescription || matchesKeywords;
    });
  }, [items, searchTerm]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<ShortcutCategory, CommandPaletteItem[]> = {
      [ShortcutCategory.CHAT]: [],
      [ShortcutCategory.NAVIGATION]: [],
      [ShortcutCategory.MODELS]: [],
      [ShortcutCategory.EDITING]: [],
      [ShortcutCategory.SYSTEM]: [],
    };

    filteredItems.forEach(item => {
      groups[item.category].push(item);
    });

    // Return only non-empty groups
    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({ category: category as ShortcutCategory, items }));
  }, [filteredItems]);

  // Get flat list for navigation
  const flatItems = useMemo(() => {
    return groupedItems.flatMap(group => group.items);
  }, [groupedItems]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < flatItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : flatItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            executeItem(flatItems[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  // Execute selected item
  const executeItem = (item: CommandPaletteItem) => {
    try {
      item.action();
      onClose();
    } catch (error) {
      console.error('Error executing command palette item:', error);
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Format shortcut keys for display
  const formatShortcut = (keys: string[]) => {
    return keys.map(key => {
      // Convert common key names to display format
      const keyMap: Record<string, string> = {
        'ctrl': '⌃',
        'cmd': '⌘',
        'alt': '⌥',
        'shift': '⇧',
        'enter': '↵',
        'escape': 'Esc',
        'arrowup': '↑',
        'arrowdown': '↓',
        'arrowleft': '←',
        'arrowright': '→',
      };
      return keyMap[key.toLowerCase()] || key.toUpperCase();
    });
  };

  // Get category display name
  const getCategoryName = (category: ShortcutCategory) => {
    const categoryNames: Record<ShortcutCategory, string> = {
      [ShortcutCategory.CHAT]: 'Chat',
      [ShortcutCategory.NAVIGATION]: 'Navigation',
      [ShortcutCategory.MODELS]: 'Models',
      [ShortcutCategory.EDITING]: 'Editing',
      [ShortcutCategory.SYSTEM]: 'System',
    };
    return categoryNames[category];
  };

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className={styles.palette}>
        <div className={styles.searchContainer}>
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Type a command or search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.resultsContainer}>
          {groupedItems.length === 0 ? (
            <div className={styles.noResults}>
              {searchTerm ? 'No commands found' : 'No commands available'}
            </div>
          ) : (
            groupedItems.map(({ category, items }) => (
              <div key={category} className={styles.categoryGroup}>
                <div className={styles.categoryTitle}>
                  {getCategoryName(category)}
                </div>
                {items.map((item, groupIndex) => {
                  const flatIndex = flatItems.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      className={`${styles.resultItem} ${
                        flatIndex === selectedIndex ? styles.selected : ''
                      }`}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                    >
                      <div className={styles.itemContent}>
                        <div className={styles.itemLabel}>{item.label}</div>
                        {item.description && (
                          <div className={styles.itemDescription}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.shortcut && item.shortcut.length > 0 && (
                        <div className={styles.shortcutKeys}>
                          {formatShortcut(item.shortcut).map((key, i) => (
                            <span key={i} className={styles.shortcutKey}>
                              {key}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerHint}>
            <div className={styles.footerShortcuts}>
              <div className={styles.footerShortcut}>
                <span className={styles.shortcutKey}>↵</span>
                <span>Select</span>
              </div>
              <div className={styles.footerShortcut}>
                <span className={styles.shortcutKey}>↑</span>
                <span className={styles.shortcutKey}>↓</span>
                <span>Navigate</span>
              </div>
              <div className={styles.footerShortcut}>
                <span className={styles.shortcutKey}>Esc</span>
                <span>Close</span>
              </div>
            </div>
            <span>⌘K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;