import React from "react";
import { ChatMessage as ChatMessageType } from "../../../shared/types/chat";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import styles from "./ChatMessage.module.css";

// Simple function to detect language from code blocks
const detectLanguage = (className: string | undefined) => {
  if (!className) return "";
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "";
};

interface ChatMessageProps {
  message: ChatMessageType;
  modelName?: string;
  isStreaming?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: (messageId: string) => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Preprocessor to ensure proper LaTeX rendering
const processContent = (content: string): string => {
  if (!content) return "";

  // Optimization: Only process content that potentially contains LaTeX
  if (!content.includes("$")) return content;

  try {
    // Process the content for LaTeX rendering, handling common LLM formatting issues
    return (
      content
        // Handle inline math with no space after the opening $
        .replace(/\$([^\s$\\])/g, "$ $1")

        // Ensure block math has proper spacing around it
        .replace(/([^\n])\$\$/g, "$1\n$$")
        .replace(/\$\$([^\n])/g, "$$\n$1")

        // Fix the common double backslash escaping in LaTeX from LLMs
        .replace(/\$(.*?)\$/g, function (match) {
          return (
            match
              // In math contexts, replace double backslashes with single backslashes
              .replace(/\\{2,}([a-zA-Z]+)/g, "\\$1")
              // Also fix commands with arguments that use curly braces
              .replace(/\\{2,}\{/g, "\\{")
          );
        })

        // Special case for \\begin and \\end in block math
        .replace(/\$\$([\s\S]*?)\$\$/g, function (match) {
          return (
            match
              .replace(/\\{2,}begin/g, "\\begin")
              .replace(/\\{2,}end/g, "\\end")
              // Fix alignment environments which often have escaped backslashes
              .replace(
                /\\{2,}(align|aligned|matrix|pmatrix|bmatrix|cases)/g,
                "\\$1"
              )
          );
        })
    );
  } catch (e) {
    console.error("Error processing LaTeX content:", e);
    return content; // Return unprocessed content if there's an error
  }
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  modelName,
  isStreaming = false,
  isVisible = true,
  onToggleVisibility,
}) => {
  const { id, sender, content, timestamp } = message;
  const isUser = sender === "user";

  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      onToggleVisibility(id);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div
      className={`${styles.messageContainer} ${styles[sender]} ${
        !isVisible ? styles.hidden : ""
      }`}
    >
      {!isUser && (
        <button
          className={styles.toggleVisibility}
          onClick={handleToggleVisibility}
          aria-label={isVisible ? "Hide message" : "Show message"}
          title={isVisible ? "Hide message" : "Show message"}
        >
          {isVisible ? "👁️" : "👁️‍🗨️"}
        </button>
      )}

      <div className={styles.messageContent}>
        {!isUser && (
          <button
            className={styles.copyButton}
            onClick={handleCopyMessage}
            aria-label="Copy message"
            title="Copy message"
          >
            📋
          </button>
        )}
        {!isUser && message.modelId && (
          <span className={styles.modelTag}>
            {modelName || `Model ID: ${message.modelId}`}
          </span>
        )}
        <span className={styles.timespacer}></span>
        <span className={styles.timestamp}>{formatTime(timestamp)}</span>
        <div
          className={`${styles.messageText} ${
            isStreaming ? styles.streaming : ""
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[
              rehypeRaw,
              [rehypeKatex, { throwOnError: false, strict: false }],
            ]}
            components={{
              // Improve paragraph spacing
              p: ({ node, ...props }) => (
                <p style={{ marginBottom: "0.6em" }} {...props} />
              ),
              // Make lists more readable
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: "0.3em" }} {...props} />
              ),
            }}
          >
            {processContent(content)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
