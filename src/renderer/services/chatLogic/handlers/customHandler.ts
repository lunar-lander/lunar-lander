import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";
import { CustomConfig } from "../../../contexts/AppContext";

export class CustomChatHandler extends BaseChatHandler {
  private customConfig: CustomConfig | null;
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string,
    customConfig: CustomConfig | null,
  ) {
    super(deps, streamHandlers, systemPrompt);
    this.customConfig = customConfig;
  }
  
  // Filter messages based on custom rules
  // For now, we'll use the same approach as discuss mode
  // In the future, this could be more sophisticated based on custom rules
  public filterMessages(chatId: string, messageId: string, _modelId: string): ChatMessage[] {
    // Get the current chat
    const currentChat = this.deps.getChat(chatId);
    if (!currentChat) return [];
    
    // Filter out the message being processed
    const chatMessages = currentChat.messages.filter(
      (msg) => msg.id !== messageId
    );
    
    // Sort messages by timestamp to maintain correct ordering
    const sortedChatMessages = [...chatMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    
    // If we have custom rules, log that they will be applied in the future
    if (this.customConfig) {
      console.log(
        `CUSTOM mode with config "${this.customConfig.name}": Using default behavior for now`
      );
      console.log(`Custom rules: ${this.customConfig.rules}`);
    } else {
      console.log(`CUSTOM mode: Using default behavior (all messages visible)`);
    }
    
    // For now, custom mode behaves like discuss mode
    return sortedChatMessages;
  }
  
  // Handle sending a message with custom rules
  // For now, we'll use the same approach as discuss mode
  public async handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]> {
    // Create a model message for each model and start API calls in parallel
    const messagePromises = modelIds.map((modelId, index) => {
      return this.createModelMessage(chatId, modelId, index)
        .then(assistantMessageId => {
          // Mark message as streaming
          this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);
          
          // Start API call with a slight delay to ensure state is updated
          setTimeout(() => {
            this.callLLMApi(chatId, assistantMessageId, modelId, {
              content,
              temperature,
              systemPrompt: this.systemPrompt,
            }).catch((error) => {
              console.error(`Error in API call for ${modelId}:`, error);
              
              // Cleanup streaming state on error
              this.streamHandlers.setStreamingMessageIds((prev) =>
                prev.filter((id) => id !== assistantMessageId)
              );
            });
          }, 100); // Short delay
          
          return assistantMessageId;
        });
    });
    
    return Promise.all(messagePromises);
  }
}