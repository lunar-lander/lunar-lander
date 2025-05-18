import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class IsolatedChatHandler extends BaseChatHandler {
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }
  
  // Filter messages for isolated mode
  // In isolated mode, models only see user messages and their own previous responses
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
    
    // Get the most recent user message (required for API calls)
    const lastUserMessage = [...sortedChatMessages]
      .reverse()
      .find((msg) => msg.sender === "user");

    // Make sure to include ALL user messages and only this model's responses
    let userMessages = sortedChatMessages.filter(
      (msg) => msg.sender === "user"
    );
    const thisModelMessages = sortedChatMessages.filter(
      (msg) => msg.sender === "assistant" && msg.modelId === modelId
    );

    // Log details of available messages
    console.log(
      `ISOLATED mode - Chat has ${sortedChatMessages.length} total messages:`
    );
    console.log(`- User messages: ${userMessages.length}`);
    console.log(`- This model's messages: ${thisModelMessages.length}`);

    // Debug: print user messages if available
    if (userMessages.length > 0) {
      console.log(
        `First user message: "${userMessages[0].content.substring(
          0,
          30
        )}..."` 
      );
      if (lastUserMessage) {
        console.log(
          `Last user message: "${lastUserMessage.content.substring(
            0,
            30
          )}..."` 
        );
      }
    } else {
      console.error(
        `ISOLATED mode: No user messages found for model ${modelId}`
      );
      // CRITICAL FIX: If we don't have user messages in the filtered set but have a lastUserMessage,
      // make sure to include it so the API call doesn't fail
      if (lastUserMessage) {
        console.log(`RECOVERY: Adding last user message manually`);
        userMessages.push(lastUserMessage);
      }
    }

    // Combine and ensure proper ordering
    const filteredMessages = [...userMessages, ...thisModelMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    console.log(
      `ISOLATED mode: Model ${modelId} will see ${filteredMessages.length} messages total`
    );
    
    return filteredMessages;
  }
  
  // Handle sending a message in isolated mode
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