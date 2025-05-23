import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAppContext } from "../../contexts/AppContext";
import DSLReference from "./DSLReference";
import { DSLParser } from "../../services/dsl/dslParser";
import { DSLFileManager } from "../../services/dsl/dslFileManager";
import { DSLConversation } from "../../../shared/types/dsl";
import styles from "./ConversationMode.module.css";

export enum ConversationModeType {
  ISOLATED = "isolated",
  DISCUSS = "discuss",
  ROUND_ROBIN = "round-robin",
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
    id: ConversationModeType.CUSTOM,
    name: "Custom DSL Mode",
    description:
      "Define custom conversation orchestration using an intuitive Domain-Specific Language (DSL). Create sophisticated multi-LLM interactions, phased conversations, role assignments, and complex workflows that can be saved and shared.",
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

  const [selectedMode, setSelectedMode] = useState<ConversationModeType>(conversationMode);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [dslFiles, setDslFiles] = useState<string[]>([]);
  const [selectedDslFile, setSelectedDslFile] = useState<string>("");
  
  const [customForm, setCustomForm] = useState<CustomConversationConfig>({
    name: "",
    description: "",
    rules: "",
  });

  useEffect(() => {
    setSelectedMode(conversationMode);
    setHasChanges(false);
    loadDslFiles();
  }, [conversationMode]);

  useEffect(() => {
    // Initialize DSL directory when component mounts
    DSLFileManager.ensureDirectory();
  }, []);

  const loadDslFiles = async () => {
    try {
      const files = await DSLFileManager.listFiles();
      setDslFiles(files);
    } catch (error) {
      console.error('Failed to load DSL files:', error);
    }
  };

  const handleModeSelect = (mode: ConversationModeType) => {
    setSelectedMode(mode);
    setHasChanges(true);
    setError("");

    if (mode === ConversationModeType.CUSTOM && customConfigs.length === 0) {
      setShowCustomForm(true);
      // Load example DSL
      const example = DSLParser.getExampleDSL();
      setCustomForm({
        name: example.name,
        description: example.description,
        rules: DSLParser.stringify(example)
      });
    } else {
      setShowCustomForm(false);
    }
  };

  const handleSave = () => {
    updateConversationMode(selectedMode);
    setHasChanges(false);
    setSaveSuccess(true);
    setError("");

    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleReset = () => {
    setSelectedMode(conversationMode);
    setHasChanges(false);
    setShowCustomForm(false);
    setError("");
  };

  const handleCustomFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateDSL = (rules: string): string | null => {
    try {
      const dsl = DSLParser.parse(rules);
      const errors = DSLParser.validate(dsl);
      if (errors.length > 0) {
        return errors.map(e => 
          e.phase !== undefined 
            ? `Phase ${e.phase + 1} ${e.field}: ${e.message}`
            : `${e.field}: ${e.message}`
        ).join('\n');
      }
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid YAML syntax';
    }
  };

  const handleAddCustomConfig = () => {
    if (!customForm.name || !customForm.rules) {
      setError("Name and DSL configuration are required");
      return;
    }

    const validationError = validateDSL(customForm.rules);
    if (validationError) {
      setError(`DSL Validation Error:\n${validationError}`);
      return;
    }

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
    setError("");
  };

  const handleLoadDslFile = async () => {
    if (!selectedDslFile) return;

    try {
      const dsl = await DSLFileManager.loadFile(selectedDslFile);
      setCustomForm({
        name: dsl.name,
        description: dsl.description,
        rules: DSLParser.stringify(dsl)
      });
      setError("");
    } catch (error) {
      setError(`Failed to load DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveDslFile = async () => {
    if (!customForm.name || !customForm.rules) {
      setError("Name and DSL configuration are required");
      return;
    }

    const validationError = validateDSL(customForm.rules);
    if (validationError) {
      setError(`DSL Validation Error:\n${validationError}`);
      return;
    }

    try {
      const dsl = DSLParser.parse(customForm.rules);
      const filename = `${customForm.name.replace(/[^a-zA-Z0-9]/g, '_')}.yaml`;
      await DSLFileManager.saveFile(filename, dsl);
      await loadDslFiles();
      setError("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setError(`Failed to save DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportDsl = async () => {
    if (!customForm.rules) {
      setError("No DSL configuration to export");
      return;
    }

    const validationError = validateDSL(customForm.rules);
    if (validationError) {
      setError(`DSL Validation Error:\n${validationError}`);
      return;
    }

    try {
      const dsl = DSLParser.parse(customForm.rules);
      await DSLFileManager.exportFile(dsl);
      setError("");
    } catch (error) {
      setError(`Failed to export DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportDsl = async () => {
    try {
      const dsl = await DSLFileManager.importFile();
      if (dsl) {
        setCustomForm({
          name: dsl.name,
          description: dsl.description,
          rules: DSLParser.stringify(dsl)
        });
        setError("");
      }
    } catch (error) {
      setError(`Failed to import DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const loadExampleDsl = () => {
    const example = DSLParser.getExampleDSL();
    setCustomForm({
      name: example.name,
      description: example.description,
      rules: DSLParser.stringify(example)
    });
    setError("");
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

      {error && (
        <div className={styles.errorMessage}>
          <pre>{error}</pre>
        </div>
      )}

      <div className={styles.actions}>
        {saveSuccess && (
          <div className={styles.successMessage}>
            Saved successfully!
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
          <div className={styles.customHeader}>
            <h3 className={styles.customTitle}>
              Custom DSL Configuration
            </h3>
            <button
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => setShowReference(true)}
            >
              📖 Reference Guide
            </button>
          </div>

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
                    <ReactMarkdown>{"```yaml\n" + config.rules + "\n```"}</ReactMarkdown>
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
              {/* File Management Section */}
              <div className={styles.fileSection}>
                <h4>📁 File Management</h4>
                <div className={styles.fileActions}>
                  <div className={styles.fileLoad}>
                    <select 
                      value={selectedDslFile} 
                      onChange={(e) => setSelectedDslFile(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Select a saved DSL file...</option>
                      {dslFiles.map(file => (
                        <option key={file} value={file}>{file}</option>
                      ))}
                    </select>
                    <button
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={handleLoadDslFile}
                      disabled={!selectedDslFile}
                    >
                      Load
                    </button>
                  </div>
                  <div className={styles.fileButtons}>
                    <button
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={handleImportDsl}
                    >
                      Import
                    </button>
                    <button
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={handleExportDsl}
                      disabled={!customForm.rules}
                    >
                      Export
                    </button>
                    <button
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={handleSaveDslFile}
                      disabled={!customForm.name || !customForm.rules}
                    >
                      Save to File
                    </button>
                    <button
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={loadExampleDsl}
                    >
                      Load Example
                    </button>
                  </div>
                </div>
              </div>

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
                  placeholder="e.g., Collaborative Refinement, Expert Panel"
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
                  DSL Configuration (YAML)
                </label>
                <textarea
                  id="rules"
                  name="rules"
                  className={styles.textarea}
                  value={customForm.rules}
                  onChange={handleCustomFormChange}
                  placeholder="Enter your DSL configuration in YAML format..."
                  rows={15}
                  style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
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

      <DSLReference 
        isOpen={showReference} 
        onClose={() => setShowReference(false)} 
      />
    </div>
  );
};

export default ConversationMode;