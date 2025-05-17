import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../../contexts/AppContext';
import styles from './ConversationMode.module.css';

export enum ConversationModeType {
  ONE_TO_MANY = 'one-to-many',
  MANY_TO_MANY = 'many-to-many',
  ROUND_ROBIN = 'round-robin',
  CUSTOM = 'custom'
}

interface ConversationModeOption {
  id: ConversationModeType;
  name: string;
  description: string;
}

export interface CustomConversationConfig {
  name: string;
  description: string;
  rules: string;
}

const CONVERSATION_MODES: ConversationModeOption[] = [
  {
    id: ConversationModeType.ONE_TO_MANY,
    name: 'One-to-Many',
    description: 'Your message is sent to all selected models independently. Each model responds without seeing responses from other models. This mode is ideal for comparing different models on the same task.'
  },
  {
    id: ConversationModeType.MANY_TO_MANY,
    name: 'Many-to-Many',
    description: 'All models see all previous messages, including responses from other models. Models can reference and build upon each other\'s responses. This creates a collaborative environment where models can enhance each other\'s thinking.'
  },
  {
    id: ConversationModeType.ROUND_ROBIN,
    name: 'Round Robin',
    description: 'Models take turns responding to your messages. Each model only sees your messages and its own previous responses. This simulates a conversation with multiple independent assistants, allowing you to get diverse perspectives.'
  },
  {
    id: ConversationModeType.CUSTOM,
    name: 'Custom Configuration',
    description: 'Create a specialized conversation flow with custom rules. Define how models interact, what context they receive, and special instructions for different scenarios.'
  }
];

const ConversationMode: React.FC = () => {
  const { conversationMode, updateConversationMode, customConfigs, addCustomConfig, updateCustomConfig, deleteCustomConfig } = useAppContext();
  
  const [selectedMode, setSelectedMode] = useState<ConversationModeType>(conversationMode);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [customForm, setCustomForm] = useState<CustomConversationConfig>({
    name: '',
    description: '',
    rules: ''
  });

  useEffect(() => {
    setSelectedMode(conversationMode);
    setHasChanges(false);
  }, [conversationMode]);

  const handleModeSelect = (mode: ConversationModeType) => {
    setSelectedMode(mode);
    setHasChanges(true);
    
    if (mode === ConversationModeType.CUSTOM && customConfigs.length === 0) {
      setShowCustomForm(true);
    } else {
      setShowCustomForm(false);
    }
  };

  const handleSave = () => {
    updateConversationMode(selectedMode);
    setHasChanges(false);
    setSaveSuccess(true);
    
    // Clear the success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleReset = () => {
    setSelectedMode(conversationMode);
    setHasChanges(false);
    setShowCustomForm(false);
  };

  const handleCustomFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCustomConfig = () => {
    if (customForm.name && customForm.rules) {
      addCustomConfig({
        ...customForm,
        id: `custom_${Date.now()}`
      });
      
      setCustomForm({
        name: '',
        description: '',
        rules: ''
      });
      
      setShowCustomForm(false);
    }
  };

  const handleDeleteCustomConfig = (configId: string) => {
    if (window.confirm('Are you sure you want to delete this custom configuration?')) {
      deleteCustomConfig(configId);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔄 Conversation Mode</h2>
      <p className={styles.description}>
        Choose how multiple language models interact with you and with each other during conversations.
        Different modes provide varied experiences and insights.
      </p>

      <div className={styles.modeSelector}>
        {CONVERSATION_MODES.map(mode => (
          <div 
            key={mode.id}
            className={`${styles.modeItem} ${selectedMode === mode.id ? styles.selected : ''}`}
            onClick={() => handleModeSelect(mode.id)}
          >
            <div className={styles.modeHeader}>
              <span className={styles.modeName}>{mode.name}</span>
            </div>
            <div className={styles.modeDescription}>
              <ReactMarkdown>{mode.description}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        {saveSuccess && (
          <div className={styles.successMessage}>
            Conversation mode saved successfully!
          </div>
        )}
        <button 
          className={`${styles.button} ${styles.secondary}`}
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Reset
        </button>
        <button 
          className={styles.button}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save
        </button>
      </div>

      {(selectedMode === ConversationModeType.CUSTOM || showCustomForm) && (
        <div className={styles.customConfig}>
          <h3 className={styles.customTitle}>Custom Conversation Configurations</h3>
          
          {customConfigs.length > 0 && !showCustomForm && (
            <div className={styles.customConfigList}>
              {customConfigs.map(config => (
                <div key={config.id} className={styles.modeItem}>
                  <div className={styles.modeHeader}>
                    <span className={styles.modeName}>{config.name}</span>
                    <button 
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={() => handleDeleteCustomConfig(config.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <p className={styles.modeDescription}>{config.description}</p>
                  <div className={styles.modeDescription}>
                    <ReactMarkdown>{config.rules}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <button 
                className={`${styles.button} ${styles.secondary}`}
                onClick={() => setShowCustomForm(true)}
              >
                + Add Custom Configuration
              </button>
            </div>
          )}
          
          {showCustomForm && (
            <div className={styles.customForm}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="name">Configuration Name</label>
                <input
                  id="name"
                  name="name"
                  className={styles.input}
                  value={customForm.name}
                  onChange={handleCustomFormChange}
                  placeholder="e.g., Expert Debate, Sequential Analysis"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="description">
                  Short Description
                </label>
                <input
                  id="description"
                  name="description"
                  className={styles.input}
                  value={customForm.description}
                  onChange={handleCustomFormChange}
                  placeholder="Brief explanation of this conversation mode"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="rules">
                  Configuration Rules (Markdown supported)
                </label>
                <textarea
                  id="rules"
                  name="rules"
                  className={styles.textarea}
                  value={customForm.rules}
                  onChange={handleCustomFormChange}
                  placeholder="Define the rules for this conversation mode..."
                  required
                />
              </div>
              
              <div className={styles.actions}>
                <button 
                  className={`${styles.button} ${styles.secondary}`}
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className={styles.button}
                  onClick={handleAddCustomConfig}
                >
                  Add Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationMode;