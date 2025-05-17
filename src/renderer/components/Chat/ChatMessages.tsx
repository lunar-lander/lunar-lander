import React, { useRef, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "../../../shared/types/chat";
import { Model } from "../../../shared/types/model";
import ChatMessage from "./ChatMessage";
import styles from "./ChatMessages.module.css";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  models: Model[];
  streamingMessageIds?: string[];
  hiddenMessageIds?: string[];
  onToggleMessageVisibility: (messageId: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  models,
  streamingMessageIds = [],
  hiddenMessageIds = [],
  onToggleMessageVisibility,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or streaming state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessageIds]);

  // Get model name from model ID
  const getModelName = (modelId?: string): string => {
    if (!modelId) return "Unknown Model";
    const model = models.find((m) => m.id === modelId);
    return model ? model.name : "Unknown Model";
  };

  return (
    <div className={styles.container}>
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          modelName={
            message.modelId ? getModelName(message.modelId) : undefined
          }
          isStreaming={streamingMessageIds.includes(message.id)}
          isVisible={!hiddenMessageIds.includes(message.id)}
          onToggleVisibility={onToggleMessageVisibility}
        />
      ))}
      <div ref={messagesEndRef} className={styles.messagesEnd} />
    </div>
  );
};

export default ChatMessages;
