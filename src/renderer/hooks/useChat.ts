import { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import { Chat } from "../../shared/types/chat";
import { ChatHandler } from "../services/chatLogic/chatHandler";
import { ChatMode } from "../components/Chat/ChatInput";
import { useConfig } from "./useConfig";

export const useChat = (chatId?: string) => {
  // State
  const [chat, setChat] = useState<Chat | null>(null);
  const [activeModelIds, setActiveModelIds] = useState<string[]>([]);
  const [streamingMessageIds, setStreamingMessageIds] = useState<string[]>([]);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summarizing, setSummarizing] = useState<boolean>(false);

  // Context and config
  const {
    models,
    getChat,
    addMessageToChat,
    updateChat,
    updateChatSummary,
    conversationMode,
    systemPrompt,
    summaryModelId,
    customConfigs,
    updateModel
  } = useAppContext();

  const { summaryModelId: configSummaryModelId } = useConfig();
  
  // Set up chat handler
  const streamHandlers = {
    setStreamingMessageIds,
    getStreamingMessageIds: () => streamingMessageIds,
  };
  
  const chatHandler = new ChatHandler(
    {
      getChat,
      updateChat: (chat) => {
        updateChat(chat);
        return true;
      },
      addMessageToChat,
      updateChatSummary: (chatId, summary) => {
        updateChatSummary(chatId, summary);
        return true;
      },
      models,
    },
    streamHandlers,
    systemPrompt,
    summaryModelId,
    configSummaryModelId || null,
    customConfigs
  );

  // Load chat data when chatId changes
  useEffect(() => {
    if (chatId) {
      const chatData = getChat(chatId);
      if (chatData) {
        setChat(chatData);
      }
    } else {
      setChat(null);
    }
  }, [chatId, getChat]);

  // Set initially active models and sync with global model state
  useEffect(() => {
    // Set all active models as initially active
    setActiveModelIds(models.filter((m) => m.isActive).map((m) => m.id));
  }, [models]);

  // Handler functions
  const handleSendMessage = async (
    content: string,
    modelIds: string[],
    temperature: number,
    mode: ChatMode
  ) => {
    if (!chatId || !chat) return;
    
    await chatHandler.sendMessage(
      chatId,
      content,
      modelIds,
      temperature,
      mode,
      conversationMode,
      setIsLoading,
      setSummarizing
    );
  };

  const handleToggleModel = (modelId: string) => {
    // Check current state
    const isCurrentlyActive = activeModelIds.includes(modelId);
    
    // Update local state
    setActiveModelIds((prev) =>
      isCurrentlyActive
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
    
    // Also update the global model state to keep sidebar in sync
    updateModel({
      id: modelId,
      isActive: !isCurrentlyActive
    });
  };

  const handleToggleMessageVisibility = (messageId: string) => {
    setHiddenMessageIds((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const generateChatSummary = async (chatId: string) => {
    await chatHandler.generateChatSummary(chatId, setSummarizing);
  };

  return {
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
  };
};