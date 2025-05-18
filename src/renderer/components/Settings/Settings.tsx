import React from "react";
import ModelSettings from "./ModelSettings";
import SystemPrompt from "./SystemPrompt";
import ConversationMode from "./ConversationMode";
import ZoomSettings from "./ZoomSettings";
import styles from "./Settings.module.css";

const Settings: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>
          Configure your Lunar Lander preferences
        </p>
      </div>

      <div className={styles.content}>
        <ZoomSettings />
        <ModelSettings />
        <SystemPrompt />
        <ConversationMode />
      </div>
    </div>
  );
};

export default Settings;
