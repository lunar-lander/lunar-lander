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
    updateChatSummaryManual,
  } = useAppContext();

  const { config, setTheme, zoomLevel, setZoom } = useConfig();
  const [themeIndex, setThemeIndex] = useState(0);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    const searchLower = searchTerm.toLowerCase();
    return (
      chat.title.toLowerCase().includes(searchLower) || 
      chat.summary.toLowerCase().includes(searchLower)
    );
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
        <button
          className={styles.actionButton}
          onClick={() => setZoom(1.0)}
          title={`Current Zoom: ${Math.round((zoomLevel || 1.0) * 100)}% - Click to reset`}
        >
          🔍
        </button>
        <button
          className={styles.actionButton}
          onClick={handleSettingsClick}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      <div className={styles.modelToggles}>
        <h3 className={styles.sectionTitle}>Models</h3>
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
          <h3 className={styles.sectionTitle}>Conversations</h3>
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
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${
                activeChat === chat.id ? styles.active : ""
              } ${chat.isStarred ? styles.starredChat : ""}`}
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
                    title="Click to edit title"
                  >
                    {chat.summary !== "Start a new conversation" ? chat.summary : "New conversation"}
                  </div>
                  <div className={styles.chatDate}>{chat.date}</div>
                  <div className={styles.chatControls}>
                    <button
                      className={styles.chatControl}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingChat(chat, e);
                      }}
                      title="Edit title"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.chatControl}
                      onClick={(e) => {
                        e.stopPropagation();
                        chat.isStarred ? unstarChat(chat.id) : starChat(chat.id);
                      }}
                      title={chat.isStarred ? "Unstar" : "Star"}
                    >
                      {chat.isStarred ? <span className={styles.starIcon}>★</span> : "☆"}
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
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
