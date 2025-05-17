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
    if (messagesEndRef.current) {
      // Force scroll to bottom with a slight delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "end"
        });
      }, 50);
    }
  }, [messages, streamingMessageIds]);
  
  // Also scroll when specific message content changes (like during streaming)
  useEffect(() => {
    const streamingMessages = messages.filter(msg => 
      streamingMessageIds.includes(msg.id)
    );
    
    if (streamingMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages, streamingMessageIds]); // Simplified dependency array to avoid issues
  
  // Effect to handle scrolling when message content changes
  useEffect(() => {
    // This is a separate effect just for content changes
    if (streamingMessageIds.length > 0) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [JSON.stringify(messages.map(m => m.id + '-' + m.content.length))]);

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
