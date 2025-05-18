import React from "react";
import { useAppContext } from "../../contexts/AppContext";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import styles from "./Chat.module.css";
import { getModeFromConversationMode } from "../../services/chatLogic";
import { useChat } from "../../hooks/useChat";

interface ChatProps {
  chatId?: string;
}

const Chat: React.FC<ChatProps> = ({ chatId }) => {
  // Use the chat hook to manage all chat logic
  const {
    chat,
    activeModelIds,
    streamingMessageIds,
    hiddenMessageIds,
    isLoading,
    summarizing,
    handleSendMessage,
    handleToggleModel,
    handleToggleMessageVisibility,
    generateChatSummary,
  } = useChat(chatId);

  // Get models and conversation mode from context
  const { models, conversationMode, summaryModelId } = useAppContext();

  // Convert from settings conversation mode to chat mode
  const chatMode = getModeFromConversationMode(conversationMode);

  return (
    <div className={styles.container}>
      {chatId && chat ? (
        <>
          <div className={styles.header}>
            <h2 className={styles.title}>
              {chat.title === "New Chat" &&
              chat.summary !== "Start a new conversation"
                ? chat.summary
                : chat.title}
              {summarizing && (
                <span className={styles.summarizing}> (Summarizing...)</span>
              )}
            </h2>
            <div className={styles.headerActions}>
              <button
                className={styles.headerButton}
                title="Clear hidden messages"
                onClick={() => handleToggleMessageVisibility("")}
              >
                👁️
              </button>
              <button
                className={styles.headerButton}
                title="Regenerate Summary"
                onClick={() => chat && chatId && generateChatSummary(chatId)}
                disabled={!summaryModelId || chat.messages.length === 0}
              >
                🔄
              </button>
              <button className={styles.headerButton} title="Export chat">
                📤
              </button>
            </div>
          </div>
          <div className={styles.messagesContainer}>
            <ChatMessages
              messages={chat.messages}
              models={models}
              streamingMessageIds={streamingMessageIds}
              hiddenMessageIds={hiddenMessageIds}
              onToggleMessageVisibility={handleToggleMessageVisibility}
            />
          </div>
          <ChatInput
            models={models}
            activeModelIds={activeModelIds}
            onSendMessage={handleSendMessage}
            onToggleModel={handleToggleModel}
            onModeChange={() => {}} // Mode change is now handled in settings
            disabled={isLoading || streamingMessageIds.length > 0}
            currentMode={chatMode}
          />
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h2 className={styles.emptyTitle}>Welcome to Lunar Lander</h2>
          <p className={styles.emptyText}>
            Start a new chat by clicking the "New Chat" button in the sidebar,
            or select an existing conversation.
          </p>
        </div>
      )}
    </div>
  );
};

export default Chat;
