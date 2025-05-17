import React from 'react';
import ModelSettings from './ModelSettings';
import SystemPrompt from './SystemPrompt';
import ConversationMode from './ConversationMode';
import styles from './Settings.module.css';

const Settings: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>Configure your ChatAAP preferences</p>
      </div>
      
      <div className={styles.content}>
        <ModelSettings />
        <SystemPrompt />
        <ConversationMode />
      </div>
    </div>
  );
};

export default Settings;