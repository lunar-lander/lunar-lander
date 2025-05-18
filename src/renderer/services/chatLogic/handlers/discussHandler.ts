import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class DiscussChatHandler extends BaseChatHandler {
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }
  
  // Filter messages for discuss mode
  // In discuss mode, all models see all messages
  public filterMessages(chatId: string, messageId: string, modelId: string): ChatMessage[] {
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
    
    // Log details of available messages
    const userMessages = sortedChatMessages.filter(
      (msg) => msg.sender === "user"
    );
    const allModelMessages = sortedChatMessages.filter(
      (msg) => msg.sender === "assistant"
    );

    console.log(
      `DISCUSS mode - Chat has ${sortedChatMessages.length} total messages:`
    );
    console.log(`- User messages: ${userMessages.length}`);
    console.log(`- All model messages: ${allModelMessages.length}`);

    // Debug: print user messages if available
    if (userMessages.length > 0) {
      console.log(
        `Last user message: "${userMessages[
          userMessages.length - 1
        ].content.substring(0, 30)}..."` 
      );
    }

    console.log(
      `DISCUSS mode: Model ${modelId} will see all ${sortedChatMessages.length} messages`
    );
    
    return sortedChatMessages;
  }
  
  // Handle sending a message in discuss mode
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