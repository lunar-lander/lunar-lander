import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAppContext } from "../../contexts/AppContext";
import styles from "./ConversationMode.module.css";

export enum ConversationModeType {
  ISOLATED = "isolated",
  DISCUSS = "discuss",
  ROUND_ROBIN = "round-robin",
  COLLABORATIVE_REFINEMENT = "collaborative-refinement",
  EXPERT_PANEL = "expert-panel",
  DEBATE = "debate",
  CONSENSUS_BUILDING = "consensus-building",
  CUSTOM = "custom",
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
    id: ConversationModeType.ISOLATED,
    name: "Isolated",
    description:
      "Each LLM can only see its own chat and output. This creates separate, independent conversations with each model, without any cross-sharing of information. Perfect for comparing responses without models influencing each other.",
  },
  {
    id: ConversationModeType.DISCUSS,
    name: "Discuss",
    description:
      "All LLMs respond concurrently, but each can see all messages from everyone. This creates a collaborative discussion where models can reference and build upon each other's thinking, similar to a group chat.",
  },
  {
    id: ConversationModeType.ROUND_ROBIN,
    name: "Round Robin",
    description:
      "LLMs respond in sequence, one after another. Each model can see all previous responses from all models. This creates a structured conversation flow where each model can build on what came before it.",
  },
  {
    id: ConversationModeType.COLLABORATIVE_REFINEMENT,
    name: "Collaborative Refinement",
    description:
      "**Multi-stage collaboration**: User asks → All LLMs answer → All LLMs see each other's responses and refine their answers → One selected LLM summarizes all responses into a final comprehensive answer. Perfect for complex problems requiring multiple perspectives and iterative improvement.",
  },
  {
    id: ConversationModeType.EXPERT_PANEL,
    name: "Expert Panel",
    description:
      "Each LLM assumes a different expert role (e.g., scientist, engineer, philosopher) and responds from that specialized perspective. Creates diverse viewpoints and comprehensive analysis by having models approach problems from different professional angles.",
  },
  {
    id: ConversationModeType.DEBATE,
    name: "Debate Mode",
    description:
      "LLMs are assigned opposing positions and engage in structured debate. They present arguments, counter-arguments, and rebuttals. Excellent for exploring controversial topics, examining pros and cons, and understanding multiple sides of complex issues.",
  },
  {
    id: ConversationModeType.CONSENSUS_BUILDING,
    name: "Consensus Building",
    description:
      "LLMs work through multiple rounds of discussion to reach agreement. They start with different perspectives, identify areas of disagreement, and gradually work toward a shared understanding or compromise solution.",
  },
  {
    id: ConversationModeType.CUSTOM,
    name: "Custom Configuration",
    description:
      "Create a specialized conversation flow with custom rules. Define how models interact, what context they receive, and special instructions for different scenarios.",
  },
];

const ConversationMode: React.FC = () => {
  const {
    conversationMode,
    updateConversationMode,
    customConfigs,
    addCustomConfig,
    updateCustomConfig,
    deleteCustomConfig,
  } = useAppContext();

  const [selectedMode, setSelectedMode] =
    useState<ConversationModeType>(conversationMode);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [customForm, setCustomForm] = useState<CustomConversationConfig>({
    name: "",
    description: "",
    rules: "",
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

  const handleCustomFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddCustomConfig = () => {
    if (customForm.name && customForm.rules) {
      addCustomConfig({
        ...customForm,
        id: `custom_${Date.now()}`,
      });

      setCustomForm({
        name: "",
        description: "",
        rules: "",
      });

      setShowCustomForm(false);
    }
  };

  const handleDeleteCustomConfig = (configId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this custom configuration?"
      )
    ) {
      deleteCustomConfig(configId);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔄 Conversation Mode</h2>
      <p className={styles.description}>
        Choose how multiple language models interact with you and with each
        other during conversations. Different modes provide varied experiences
        and insights.
      </p>

      <div className={styles.modeSelector}>
        {CONVERSATION_MODES.map((mode) => (
          <div
            key={mode.id}
            className={`${styles.modeItem} ${
              selectedMode === mode.id ? styles.selected : ""
            }`}
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
          <h3 className={styles.customTitle}>
            Custom Conversation Configurations
          </h3>

          {customConfigs.length > 0 && !showCustomForm && (
            <div className={styles.customConfigList}>
              {customConfigs.map((config) => (
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
                <label className={styles.label} htmlFor="name">
                  Configuration Name
                </label>
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
