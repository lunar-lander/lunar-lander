import { Chat, ChatMessage } from "../../../shared/types/chat";
import { Model } from "../../../shared/types/model";
import { ConversationModeType } from "../../components/Settings/ConversationMode";
import { ChatMode } from "../../components/Chat/ChatInput";
import { SummaryGenerator } from "../summaryGenerator";
import { createChatHandler } from "./handlers";
import { CustomConfig } from "../../contexts/AppContext";

// Map between ChatMode and ConversationModeType
export const getModeFromConversationMode = (mode: ConversationModeType): ChatMode => {
  switch (mode) {
    case ConversationModeType.ISOLATED:
      return ChatMode.ISOLATED;
    case ConversationModeType.DISCUSS:
      return ChatMode.DISCUSS;
    case ConversationModeType.ROUND_ROBIN:
      return ChatMode.ROUND_ROBIN;
    case ConversationModeType.CUSTOM:
      return ChatMode.CUSTOM;
    default:
      return ChatMode.ISOLATED;
  }
};

// Interface for chat handlers that need to interact with app context
export interface ChatHandlerDeps {
  getChat: (chatId: string) => Chat | null;
  updateChat: (chat: Chat) => boolean;
  addMessageToChat: (chatId: string, message: ChatMessage) => any;
  updateChatSummary: (chatId: string, summary: string) => boolean;
  models: Model[];
}

// Interface for message streaming state handlers
export interface StreamingStateHandlers {
  setStreamingMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  getStreamingMessageIds: () => string[];
}

export class ChatHandler {
  private deps: ChatHandlerDeps;
  private streamHandlers: StreamingStateHandlers;
  private systemPrompt: string;
  private summaryModelId: string | null;
  private configSummaryModelId: string | null;
  private customConfigs: CustomConfig[];
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string,
    summaryModelId: string | null,
    configSummaryModelId: string | null,
    customConfigs: CustomConfig[] = []
  ) {
    this.deps = deps;
    this.streamHandlers = streamHandlers;
    this.systemPrompt = systemPrompt;
    this.summaryModelId = summaryModelId;
    this.configSummaryModelId = configSummaryModelId;
    this.customConfigs = customConfigs;
  }

  // Handle sending a new message
  public async sendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number,
    _mode: ChatMode,
    conversationMode: ConversationModeType,
    setIsLoading: (loading: boolean) => void,
    setSummarizing: (summarizing: boolean) => void
  ) {
    if (!chatId) return;

    setIsLoading(true);

    try {
      // Get the chat
      const chat = this.deps.getChat(chatId);
      if (!chat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }

      // Create and add user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        sender: "user",
        content,
        timestamp: Date.now(),
      };

      // Add user message and start generating replies from selected models
      this.deps.addMessageToChat(chatId, userMessage);

      // If this is the first message in the chat, flag for summary generation
      const isFirstMessage = chat.messages.length === 0;
      
      // Find active custom config if in custom mode
      let activeCustomConfig: CustomConfig | null = null;
      if (conversationMode === ConversationModeType.CUSTOM && this.customConfigs.length > 0) {
        activeCustomConfig = this.customConfigs[0]; // For now just use the first one
      }

      // Create an appropriate handler based on the conversation mode
      const handler = createChatHandler(
        conversationMode,
        this.deps,
        this.streamHandlers,
        this.systemPrompt,
        activeCustomConfig
      );

      // Delegate message handling to the specific handler
      const messageIds = await handler.handleSendMessage(
        chatId,
        content,
        modelIds,
        temperature
      );

      console.log(`Successfully added ${messageIds.length} messages to chat ${chatId}`);

      // Check if we need to generate a summary
      if (isFirstMessage && this.summaryModelId) {
        this.setupSummaryGeneration(chatId, setSummarizing);
      }
    } catch (error) {
      console.error(`Error sending message:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  // Set up summary generation after first message
  private setupSummaryGeneration(chatId: string, setSummarizing: (summarizing: boolean) => void) {
    // First, we'll wait a moment to let the UI stabilize
    setTimeout(() => {
      console.log(`Setting up summary generation wait for chat ${chatId}`);

      // Then, we'll wait for the first model to respond before generating summary
      const waitForFirstResponse = setInterval(() => {
        // Check if there are any messages still streaming
        if (this.streamHandlers.getStreamingMessageIds().length === 0) {
          clearInterval(waitForFirstResponse);
          console.log(
            `All responses complete, initiating summary generation for ${chatId} with delay`
          );

          // Wait a bit longer to make sure everything is stable before generating summary
          setTimeout(() => {
            // Double check that the chat still exists and has messages
            const chatToSummarize = this.deps.getChat(chatId);
            if (
              chatToSummarize &&
              chatToSummarize.messages &&
              chatToSummarize.messages.length > 0
            ) {
              this.generateChatSummary(chatId, setSummarizing, false);
            } else {
              console.error(
                `Chat ${chatId} no longer valid before summary generation`
              );
            }
          }, 1000);
        } else {
          console.log(
            `Still waiting for ${this.streamHandlers.getStreamingMessageIds().length} responses to complete before summary`
          );
        }
      }, 1000);
    }, 500);
  }

  // Generate chat summary using the designated summary model
  public async generateChatSummary(chatId: string, setSummarizing: (value: boolean) => void, isRegeneration: boolean = false) {
    console.log(`Attempting to generate summary for chat ${chatId}`);
    // Use config summary model ID if available, otherwise use the one from context
    let effectiveSummaryModelId = this.configSummaryModelId || this.summaryModelId;

    // If no summary model is configured, try to use the first active model
    if (!effectiveSummaryModelId) {
      const activeModels = this.deps.models.filter(m => m.isActive);
      if (activeModels.length > 0) {
        effectiveSummaryModelId = activeModels[0].id;
        console.log(`No summary model configured, using first active model: ${effectiveSummaryModelId}`);
      } else {
        console.log(`No summary model ID available and no active models, skipping summary generation`);
        return;
      }
    }

    const currentChat = this.deps.getChat(chatId);
    if (!currentChat) {
      console.error(`Chat ${chatId} not found for summary generation`);
      return;
    }

    // Make a copy of the chat to avoid modifying the original
    const chatCopy = JSON.parse(JSON.stringify(currentChat));

    // Check if chat has messages
    if (!chatCopy.messages || chatCopy.messages.length === 0) {
      console.warn(
        `Chat ${chatId} has no messages, skipping summary generation`
      );
      return;
    }

    console.log(
      `Starting summary generation for chat ${chatId} with ${chatCopy.messages.length} messages`
    );
    setSummarizing(true);

    try {
      // First generate a basic summary as a fallback
      const basicSummary = SummaryGenerator.generateBasicSummary(chatCopy);
      console.log(`Generated basic summary: "${basicSummary}"`);

      // Update with basic summary first to ensure we have something
      this.deps.updateChatSummary(chatId, basicSummary);

      // Try to generate an LLM summary in a way that won't affect the chat state
      try {
        // Call the LLM API to generate a real summary - don't let this affect chat
        console.log(
          `Calling LLM API for better summary using model ${effectiveSummaryModelId}`
        );
        const llmSummary = await SummaryGenerator.generateLLMSummary(
          chatCopy,
          effectiveSummaryModelId,
          isRegeneration
        );
        console.log(`Generated LLM summary: "${llmSummary}"`);

        if (llmSummary && llmSummary.trim() !== "") {
          // Only update if we got a valid summary
          this.deps.updateChatSummary(chatId, llmSummary);
        }
      } catch (llmError) {
        // Just log the error but don't fail - we already have the basic summary
        console.error("Error generating LLM summary:", llmError);
        // We don't need to do anything here as we already set the basic summary
      }

      // Refresh chat data but with safeguards
      const updatedChat = this.deps.getChat(chatId);
      if (
        updatedChat &&
        updatedChat.messages &&
        updatedChat.messages.length > 0
      ) {
        // Safety check for message consistency
        if (currentChat.messages && currentChat.messages.length > 0 &&
            (!updatedChat.messages || updatedChat.messages.length === 0)) {
          console.error(`Updated chat has no messages after summary generation!`);
          // If the updated chat is empty but our original had messages, something went wrong
          console.log(
            `Restoring original chat with ${currentChat.messages.length} messages`
          );
          // Restore the original chat
          this.deps.updateChat(currentChat);
        }
      }
    } catch (error) {
      console.error("Fatal error in summary generation:", error);
      // If a fatal error occurs, restore original chat data
      this.deps.updateChat(currentChat);
    } finally {
      setSummarizing(false);
    }
  }
}