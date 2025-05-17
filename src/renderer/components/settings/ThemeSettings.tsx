import React, { useState } from "react";
import { useConfig } from "../../hooks/useConfig";
import { ThemeConfig } from "../../../main/config/config-manager";

const ThemeSettings: React.FC = () => {
  const {
    config,
    currentTheme,
    loading,
    saveTheme,
    deleteTheme,
    setTheme,
    toggleSystemTheme,
  } = useConfig();

  const [newTheme, setNewTheme] = useState<ThemeConfig>({
    name: "",
    primary: "#1a73e8",
    secondary: "#4285f4",
    background: "#ffffff",
    text: "#202124",
    sidebar: "#f5f5f5",
    accent: "#fbbc04",
    success: "#34a853",
    error: "#ea4335",
    warning: "#fbbc04",
    info: "#4285f4",
  });

  const [isEditingTheme, setIsEditingTheme] = useState(false);

  if (loading || !config || !currentTheme) {
    return <div>Loading settings...</div>;
  }

  const handleThemeChange = (themeName: string) => {
    setTheme(themeName);
  };

  const handleSystemThemeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    toggleSystemTheme(e.target.checked);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTheme((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveTheme = () => {
    if (newTheme.name.trim()) {
      saveTheme(newTheme);
      setNewTheme({
        name: "",
        primary: "#1a73e8",
        secondary: "#4285f4",
        background: "#ffffff",
        text: "#202124",
        sidebar: "#f5f5f5",
        accent: "#fbbc04",
        success: "#34a853",
        error: "#ea4335",
        warning: "#fbbc04",
        info: "#4285f4",
      });
      setIsEditingTheme(false);
    }
  };

  const handleDeleteTheme = (themeName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the theme "${themeName}"?`
      )
    ) {
      deleteTheme(themeName);
    }
  };

  return (
    <div className="theme-settings">
      <h2>Theme Settings</h2>

      <div className="system-theme-toggle">
        <label>
          <input
            type="checkbox"
            checked={config.theme.system}
            onChange={handleSystemThemeToggle}
          />
          Use system theme preference (light/dark)
        </label>
      </div>

      <div className="current-theme">
        <h3>Current Theme: {currentTheme.name}</h3>
        <div
          className="theme-preview"
          style={{ backgroundColor: currentTheme.background }}
        >
          <div className="text-sample" style={{ color: currentTheme.text }}>
            Text Sample
          </div>
          <div
            className="primary-button"
            style={{ backgroundColor: currentTheme.primary, color: "#fff" }}
          >
            Primary Button
          </div>
          <div
            className="secondary-button"
            style={{ backgroundColor: currentTheme.secondary, color: "#fff" }}
          >
            Secondary Button
          </div>
        </div>
      </div>

      <div className="available-themes">
        <h3>Available Themes</h3>
        <div className="theme-list">
          {config.theme.custom.map((theme) => (
            <div key={theme.name} className="theme-item">
              <button
                onClick={() => handleThemeChange(theme.name)}
                className={currentTheme.name === theme.name ? "active" : ""}
              >
                {theme.name}
              </button>
              {theme.name !== "Light" && theme.name !== "Dark" && (
                <button
                  onClick={() => handleDeleteTheme(theme.name)}
                  className="delete-btn"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isEditingTheme ? (
        <button
          onClick={() => setIsEditingTheme(true)}
          className="create-theme-btn"
        >
          Create New Theme
        </button>
      ) : (
        <div className="theme-editor">
          <h3>Create New Theme</h3>

          <div className="form-group">
            <label htmlFor="name">Theme Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newTheme.name}
              onChange={handleInputChange}
              placeholder="My Custom Theme"
            />
          </div>

          <div className="form-group">
            <label htmlFor="primary">Primary Color</label>
            <input
              type="color"
              id="primary"
              name="primary"
              value={newTheme.primary}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="secondary">Secondary Color</label>
            <input
              type="color"
              id="secondary"
              name="secondary"
              value={newTheme.secondary}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="background">Background Color</label>
            <input
              type="color"
              id="background"
              name="background"
              value={newTheme.background}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="text">Text Color</label>
            <input
              type="color"
              id="text"
              name="text"
              value={newTheme.text}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sidebar">Sidebar Color</label>
            <input
              type="color"
              id="sidebar"
              name="sidebar"
              value={newTheme.sidebar}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="accent">Accent Color</label>
            <input
              type="color"
              id="accent"
              name="accent"
              value={newTheme.accent}
              onChange={handleInputChange}
            />
          </div>

          <div
            className="theme-preview"
            style={{ backgroundColor: newTheme.background }}
          >
            <div className="text-sample" style={{ color: newTheme.text }}>
              Text Sample
            </div>
            <div
              className="primary-button"
              style={{ backgroundColor: newTheme.primary, color: "#fff" }}
            >
              Primary Button
            </div>
            <div
              className="secondary-button"
              style={{ backgroundColor: newTheme.secondary, color: "#fff" }}
            >
              Secondary Button
            </div>
          </div>

          <div className="editor-actions">
            <button onClick={handleSaveTheme} disabled={!newTheme.name.trim()}>
              Save Theme
            </button>
            <button onClick={() => setIsEditingTheme(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSettings;
