import React, { useState, useEffect, useRef } from "react";
import styles from "./Sidebar.module.css";
import { useAppContext } from "../../contexts/AppContext";
import { useConfig } from "../../hooks/useConfig";
import { Chat } from "../../../shared/types/chat";

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const {
    chats,
    activeChat,
    isDarkTheme,
    toggleTheme,
    createChat,
    selectChat,
    setCurrentView,
    models,
    updateModel,
    starChat,
    unstarChat,
    deleteChat,
    deleteAllChats,
    updateChatSummaryManual,
  } = useAppContext();

  const { config, setTheme, zoomLevel, setZoom } = useConfig();
  const [themeIndex, setThemeIndex] = useState(0);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Filter and sort chats based on search term and star status
  const filteredChats = chats
    .filter(chat => {
      const searchLower = searchTerm.toLowerCase();
      return chat.summary.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      // First sort by starred status (starred chats come first)
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      
      // Then sort by last updated time (most recent first)
      return b.lastUpdated - a.lastUpdated;
    });

  // Load available themes
  useEffect(() => {
    if (config && config.theme && config.theme.custom) {
      // Extract theme names
      const themeNames = config.theme.custom.map((theme) => theme.name);
      setAvailableThemes(themeNames);

      // Find current theme index
      const currentIndex = themeNames.findIndex(
        (name) => name === config.theme.current
      );
      if (currentIndex >= 0) {
        setThemeIndex(currentIndex);
      }
    }
  }, [config]);

  // Handle new chat button click
  const handleNewChat = () => {
    createChat();
  };

  // Handle settings click
  const handleSettingsClick = () => {
    setCurrentView("settings");
  };

  // Cycle through themes
  const cycleTheme = async () => {
    if (availableThemes.length <= 1) {
      // If only one theme, just use the simple toggle
      toggleTheme();
      return;
    }

    // Calculate next theme index
    const nextIndex = (themeIndex + 1) % availableThemes.length;
    const nextTheme = availableThemes[nextIndex];

    // Update theme
    const success = await setTheme(nextTheme);
    if (success) {
      setThemeIndex(nextIndex);

      // Force a manual refresh of the page to apply theme changes immediately
      // This is a temporary solution - in production, you'd want to avoid this approach
      window.location.reload();
    }
  };

  // Toggle model active state
  const handleToggleModel = (modelId: string, isActive: boolean) => {
    updateModel({
      id: modelId,
      isActive: !isActive,
    });
  };

  // Get emoji for current theme
  const getThemeEmoji = () => {
    if (availableThemes.length <= 0) return "🎨";

    const currentTheme = availableThemes[themeIndex];
    switch (currentTheme) {
      case "Light":
        return "☀️";
      case "Dark":
        return "🌙";
      case "Cyberpunk":
        return "🤖";
      case "Solarized Light":
        return "☯️";
      case "Solarized Dark":
        return "🧿";
      case "Synthwave":
        return "🌆";
      case "Nord":
        return "❄️";
      case "Material Oceanic":
        return "🌊";
      default:
        return "🎨";
    }
  };
  
  // Focus on edit input when editing a chat title
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);
  
  // Handle starting to edit a chat summary
  const startEditingChat = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    // Set the current summary as the initial value to edit
    setEditedTitle(chat.summary !== "Start a new conversation" ? chat.summary : "");
  };
  
  // Handle saving an edited chat summary
  const saveEditedSummary = (chatId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim()) {
      updateChatSummaryManual(chatId, editedTitle.trim());
    }
    setEditingChatId(null);
  };
  
  // Handle cancel editing
  const cancelEditing = () => {
    setEditingChatId(null);
  };
  
  // Generate pastel color for model
  const getModelColor = (modelId: string): string => {
    // Create a consistent hash from model ID
    let hash = 0;
    for (let i = 0; i < modelId.length; i++) {
      hash = ((hash << 5) - hash + modelId.charCodeAt(i)) & 0xffffffff;
    }
    
    // Generate pastel colors using the hash
    const hue = Math.abs(hash) % 360;
    const saturation = 45 + (Math.abs(hash) % 20); // 45-65%
    const lightness = 85 + (Math.abs(hash) % 10); // 85-95%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Format relative time for chats
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Default to date format
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <button className={styles.newChatButton} onClick={handleNewChat}>
          <span>+</span> New Chat
        </button>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={cycleTheme}
          title={`Current Theme: ${
            availableThemes[themeIndex] || "Default"
          } - Click to cycle themes`}
        >
          {getThemeEmoji()}
        </button>
        <span className={styles.zoomControls}>
          <button
            className={styles.zoomButton}
            onClick={() => setZoom(Math.max(0.5, Math.round((zoomLevel - 0.1) * 10) / 10))}
            title="Zoom Out"
          >
            −
          </button>
          <button
            className={styles.zoomResetButton}
            onClick={() => setZoom(1.0)}
            title={`Current Zoom: ${Math.round((zoomLevel || 1.0) * 100)}% - Click to reset`}
          >
            🔍
          </button>
          <button
            className={styles.zoomButton}
            onClick={() => setZoom(Math.min(2.0, Math.round((zoomLevel + 0.1) * 10) / 10))}
            title="Zoom In"
          >
            +
          </button>
        </span>
        <button
          className={styles.actionButton}
          onClick={handleSettingsClick}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      <div className={styles.modelToggles}>
        <div className={styles.chatListHeaderTop}>
          <h3 className={styles.sectionTitle}>Models</h3>
          {models.length > 0 && (
            <span className={styles.modelCount}>
              {models.filter(m => m.isActive).length} active
            </span>
          )}
        </div>
        {models.length === 0 ? (
          <div className={styles.noModels}>No models configured yet</div>
        ) : (
          <div className={styles.modelList}>
            {models.map((model) => (
              <div
                key={model.id}
                className={`${styles.modelToggle} ${
                  model.isActive ? styles.active : ""
                }`}
                style={{ backgroundColor: getModelColor(model.id) }}
                onClick={() => handleToggleModel(model.id, model.isActive)}
              >
                <span className={styles.modelName}>{model.name}</span>
                <span className={styles.toggleIndicator}>
                  {model.isActive ? "✓" : "○"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.chatList}>
        <div className={styles.chatListHeader}>
          <div className={styles.chatListHeaderTop}>
            <h3 className={styles.sectionTitle}>Conversations</h3>
            {chats.length > 0 && (
              <button 
                className={styles.clearAllButton}
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete ALL conversations? This cannot be undone.")) {
                    deleteAllChats();
                  }
                }}
                title="Clear all conversations"
              >
                Clear all
              </button>
            )}
          </div>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        {filteredChats.length === 0 ? (
          <div className={styles.noChats}>
            {chats.length === 0 ? "No chat history yet" : "No matches found"}
          </div>
        ) : (
          <>
            {/* Render starred chats with heading if there are any */}
            {filteredChats.some(chat => chat.isStarred) && (
              <>
                <div className={styles.sectionTitle}>Starred</div>
                {filteredChats
                  .filter(chat => chat.isStarred)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className={`${styles.chatItem} ${
                        activeChat === chat.id ? styles.active : ""
                      } ${styles.starredChat}`}
                      onClick={() => selectChat(chat.id)}
                    >
                      {editingChatId === chat.id ? (
                        <form onSubmit={(e) => saveEditedSummary(chat.id, e)} className={styles.editTitleForm}>
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className={styles.editTitleInput}
                            onBlur={() => cancelEditing()}
                            onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                          />
                        </form>
                      ) : (
                        <>
                          <div 
                            className={styles.chatSummary}
                            onClick={(e) => startEditingChat(chat, e)}
                            title="Click to edit summary"
                          >
                            {chat.summary !== "Start a new conversation" ? chat.summary : "New conversation"}
                          </div>
                          <div className={styles.chatDate} title={new Date(chat.lastUpdated).toLocaleString()}>
                            {formatRelativeTime(chat.lastUpdated)}
                          </div>
                          <div className={styles.chatControls}>
                            <button
                              className={styles.chatControl}
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingChat(chat, e);
                              }}
                              title="Edit summary"
                            >
                              ✏️
                            </button>
                            <button
                              className={styles.chatControl}
                              onClick={(e) => {
                                e.stopPropagation();
                                unstarChat(chat.id);
                              }}
                              title="Unstar"
                            >
                              <span className={styles.starIcon}>★</span>
                            </button>
                            <button
                              className={styles.chatControl}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to delete this conversation?")) {
                                  deleteChat(chat.id);
                                }
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </>
            )}
            
            {/* Render non-starred chats with heading if there are both starred and non-starred chats */}
            {filteredChats.some(chat => chat.isStarred) && filteredChats.some(chat => !chat.isStarred) && (
              <div className={styles.sectionTitle}>Recent</div>
            )}
            
            {/* Render non-starred chats */}
            {filteredChats
              .filter(chat => !chat.isStarred)
              .map((chat) => (
                <div
                  key={chat.id}
                  className={`${styles.chatItem} ${
                    activeChat === chat.id ? styles.active : ""
                  }`}
                  onClick={() => selectChat(chat.id)}
                >
                  {editingChatId === chat.id ? (
                    <form onSubmit={(e) => saveEditedSummary(chat.id, e)} className={styles.editTitleForm}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className={styles.editTitleInput}
                        onBlur={() => cancelEditing()}
                        onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                      />
                    </form>
                  ) : (
                    <>
                      <div 
                        className={styles.chatSummary}
                        onClick={(e) => startEditingChat(chat, e)}
                        title="Click to edit summary"
                      >
                        {chat.summary !== "Start a new conversation" ? chat.summary : "New conversation"}
                      </div>
                      <div className={styles.chatDate} title={new Date(chat.lastUpdated).toLocaleString()}>
                        {formatRelativeTime(chat.lastUpdated)}
                      </div>
                      <div className={styles.chatControls}>
                        <button
                          className={styles.chatControl}
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingChat(chat, e);
                          }}
                          title="Edit summary"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.chatControl}
                          onClick={(e) => {
                            e.stopPropagation();
                            starChat(chat.id);
                          }}
                          title="Star"
                        >
                          ☆
                        </button>
                        <button
                          className={styles.chatControl}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this conversation?")) {
                              deleteChat(chat.id);
                            }
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
