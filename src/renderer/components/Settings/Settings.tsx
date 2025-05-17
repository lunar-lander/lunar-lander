import React from 'react';
import styles from './Settings.module.css';

const Settings: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>Configure your ChatAAP preferences</p>
      </div>
      
      <div className={styles.content}>
        {/* Settings content will go here */}
        <p>Settings page is under construction.</p>
      </div>
    </div>
  );
};

export default Settings;