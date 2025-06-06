import React, { useState, useEffect, useCallback } from "react";
import { Model } from "../../../shared/types/model";
import styles from "./ChatInput.module.css";
import MDEditor from "@uiw/react-md-editor";
import { ConversationModeType } from "../Settings/ConversationMode";
import { useConfig } from "../../hooks/useConfig";

// Chat mode options - aligned with settings definitions
export enum ChatMode {
  ISOLATED = "isolated",
  DISCUSS = "discuss",
  ROUND_ROBIN = "round-robin",
  CUSTOM = "custom",
}

interface ChatInputProps {
  models: Model[];
  activeModelIds: string[];
  onSendMessage: (
    message: string,
    modelIds: string[],
    temperature: number,
    mode: ChatMode
  ) => void;
  onToggleModel: (modelId: string) => void;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
  currentMode: ChatMode;
}

const ChatInput: React.FC<ChatInputProps> = ({
  models,
  activeModelIds,
  onSendMessage,
  onToggleModel,
  onModeChange,
  disabled = false,
  currentMode,
}) => {
  const { inputHeight: configInputHeight, setInputHeightPersistent } = useConfig();
  const [message, setMessage] = useState("");
  const [temperature, setTemperature] = useState(1.0);
  const [editorHeight, setEditorHeight] = useState(150);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  // Sync with config
  useEffect(() => {
    if (configInputHeight) {
      setEditorHeight(configInputHeight);
    }
  }, [configInputHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && activeModelIds.length > 0 && !disabled) {
      onSendMessage(message, activeModelIds, temperature, currentMode);
      setMessage("");
    }
  };

  const handleToggleModel = (modelId: string) => {
    onToggleModel(modelId);
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModeChange(e.target.value as ChatMode);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(parseFloat(e.target.value));
  };

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(editorHeight);
  }, [editorHeight]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(100, Math.min(400, startHeight + deltaY));
    setEditorHeight(newHeight);
  }, [isResizing, startY, startHeight]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    // Save the final height to config
    if (setInputHeightPersistent) {
      setInputHeightPersistent(editorHeight);
    }
  }, [editorHeight, setInputHeightPersistent]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  return (
    <div className={styles.container}>
      <div className={styles.controlsBar}>
        <div className={styles.modelToggles}>
          {models.map((model) => (
            <div
              key={model.id}
              className={`${styles.modelToggle} ${
                activeModelIds.includes(model.id) ? styles.active : ""
              }`}
              onClick={() => handleToggleModel(model.id)}
            >
              {model.name}
            </div>
          ))}
        </div>

        <div className={styles.chatControls}>
          <div className={styles.temperatureControl}>
            <span>Temperature:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={handleTemperatureChange}
              className={styles.temperatureSlider}
              title={temperature.toString()}
            />
            <span>{temperature}</span>
          </div>

          <select
            className={styles.modeSelect}
            value={currentMode}
            onChange={handleModeChange}
          >
            <option value={ChatMode.ISOLATED}>Isolated</option>
            <option value={ChatMode.DISCUSS}>Discuss</option>
            <option value={ChatMode.ROUND_ROBIN}>Round Robin</option>
            <option value={ChatMode.CUSTOM}>Custom</option>
          </select>
        </div>
      </div>

      <div className={styles.editorWrapper} onKeyDown={handleKeyDown}>
        <MDEditor
          value={message}
          onChange={(value) => setMessage(value || "")}
          preview="edit"
          height={editorHeight}
          className={styles.mdEditor}
          textareaProps={{
            placeholder: "Type a message using Markdown...",
            disabled: disabled,
          }}
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!message.trim() || activeModelIds.length === 0 || disabled}
          title="Send"
        >
          →
        </button>
      </div>

      <div className={styles.helpText}>
        Press Ctrl+Enter to send • Ctrl+K for commands • Ctrl+N for new chat
      </div>
      <div className={styles.resizeHandle} onMouseDown={handleResizeMouseDown} />
    </div>
  );
};

export default ChatInput;
