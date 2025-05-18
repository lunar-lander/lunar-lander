import React, { useState, useEffect } from "react";
import { useAppContext } from "../../contexts/AppContext";
import styles from "./SystemPrompt.module.css";

const SYSTEM_PROMPT_TEMPLATES = [
  {
    name: "General Assistant",
    prompt:
      "You are a helpful, creative, and friendly assistant. Answer the user's questions concisely and accurately.",
  },
  {
    name: "Expert Assistant",
    prompt:
      "You are an expert assistant with deep knowledge across multiple domains. Provide detailed, nuanced, and accurate information to the user. When appropriate, consider multiple perspectives and explain complex concepts clearly.",
  },
  {
    name: "Code Assistant",
    prompt:
      "You are a skilled programming assistant. Help the user write code, debug issues, explain concepts, and implement solutions. Prioritize correctness, efficiency, and best practices. When showing code, include helpful comments.",
  },
  {
    name: "Creative Writer",
    prompt:
      "You are a creative writing assistant with a talent for imaginative, engaging, and original content. Help the user with storytelling, creative ideas, character development, and stylistic improvements.",
  },
  {
    name: "Math & Science",
    prompt:
      "You are a math and science assistant with expertise in various scientific disciplines. Explain concepts clearly, help solve problems step-by-step, and provide accurate scientific information. Use formulas, diagrams, and analogies when helpful.",
  },
  {
    name: "Custom",
    prompt: "",
  },
];

const SystemPrompt: React.FC = () => {
  const { systemPrompt, updateSystemPrompt } = useAppContext();
  const [prompt, setPrompt] = useState(systemPrompt || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setPrompt(systemPrompt || "");
    setHasChanges(false);
  }, [systemPrompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setHasChanges(true);
  };

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    updateSystemPrompt(prompt);
    setHasChanges(false);
    setSaveSuccess(true);

    // Clear the success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleReset = () => {
    setPrompt(systemPrompt || "");
    setHasChanges(false);
  };

  const handleTemplateSelect = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setHasChanges(true);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>💬 System Prompt</h2>
      <p className={styles.description}>
        The system prompt is sent to all language models at the beginning of
        each conversation. It helps set the tone, style, and behavior of the AI
        responses. This prompt is shared across all models.
      </p>

      <div className={styles.promptEditor}>
        <textarea
          className={styles.textarea}
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter a system prompt to guide all language models..."
        />
      </div>

      <div className={styles.actions}>
        {saveSuccess && (
          <div className={styles.successMessage}>
            System prompt saved successfully!
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

      <div className={styles.templates}>
        <h3 className={styles.templatesTitle}>Template Library</h3>
        <p className={styles.description}>
          Select a pre-made system prompt template, or use them as a starting
          point for your own custom prompt.
        </p>
        <div className={styles.templateButtons}>
          {SYSTEM_PROMPT_TEMPLATES.map((template) => (
            <button
              key={template.name}
              className={styles.templateButton}
              onClick={() => handleTemplateSelect(template.prompt)}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemPrompt;
