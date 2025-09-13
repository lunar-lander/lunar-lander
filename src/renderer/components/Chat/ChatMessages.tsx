import React, { useRef, useEffect, useCallback } from "react";
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
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Optimized scroll function with throttling
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100); // Throttle scrolling to every 100ms max
  }, []);

  // Single consolidated effect for all scrolling scenarios
  useEffect(() => {
    const hasStreamingMessages = streamingMessageIds.length > 0;
    const shouldScroll = messages.length > 0 && (hasStreamingMessages || messages.length > 0);

    if (shouldScroll) {
      scrollToBottom();
    }
  }, [messages.length, streamingMessageIds.length, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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
