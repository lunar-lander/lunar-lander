import React from "react";
import { useAppContext } from "../../contexts/AppContext";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import styles from "./Chat.module.css";
import { getModeFromConversationMode } from "../../services/chatLogic";
import { useChat } from "../../hooks/useChat";
import { ConversationModeType } from "../Settings/ConversationMode";

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
  const { models, conversationMode, summaryModelId, updateConversationMode } = useAppContext();

  // Convert from settings conversation mode to chat mode
  const chatMode = getModeFromConversationMode(conversationMode);
  
  // Handle mode change
  const handleModeChange = (newMode: string) => {
    // Map from ChatMode to ConversationModeType
    let newConversationMode: ConversationModeType;
    
    switch (newMode) {
      case 'isolated':
        newConversationMode = ConversationModeType.ISOLATED;
        break;
      case 'discuss':
        newConversationMode = ConversationModeType.DISCUSS;
        break;
      case 'round-robin':
        newConversationMode = ConversationModeType.ROUND_ROBIN;
        break;
      case 'custom':
        newConversationMode = ConversationModeType.CUSTOM;
        break;
      default:
        newConversationMode = ConversationModeType.ISOLATED;
    }
    
    // Update conversation mode in context
    updateConversationMode(newConversationMode);
  };

  return (
    <div className={styles.container}>
      {chatId && chat ? (
        <>
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
            onModeChange={handleModeChange}
            disabled={isLoading || streamingMessageIds.length > 0}
            currentMode={chatMode}
            onExportChat={() => {
              // TODO: Implement export functionality
              console.log('Export chat clicked');
            }}
            onToggleMessageVisibility={() => handleToggleMessageVisibility("")}
            onRegenerateSummary={() => chat && chatId && generateChatSummary(chatId)}
            summaryModelId={summaryModelId}
            chatMessagesLength={chat.messages.length}
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
