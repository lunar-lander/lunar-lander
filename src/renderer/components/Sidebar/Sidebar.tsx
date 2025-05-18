import React, { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import { useAppContext } from "../../contexts/AppContext";
import { useConfig } from "../../hooks/useConfig";

const Sidebar: React.FC = () => {
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
  } = useAppContext();

  const { config, setTheme } = useConfig();
  const [themeIndex, setThemeIndex] = useState(0);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);

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
        <h3 className={styles.sectionTitle}>Conversations</h3>
        {chats.length === 0 ? (
          <div className={styles.noChats}>No chat history yet</div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${
                activeChat === chat.id ? styles.active : ""
              }`}
              onClick={() => selectChat(chat.id)}
            >
              <div className={styles.chatTitle}>{chat.title}</div>
              <div className={styles.chatSummary}>{chat.summary}</div>
              <div className={styles.chatDate}>{chat.date}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
