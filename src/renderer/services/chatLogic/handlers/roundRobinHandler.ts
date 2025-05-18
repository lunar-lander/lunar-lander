import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class RoundRobinChatHandler extends BaseChatHandler {
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }
  
  // Filter messages for round robin mode
  // In round robin mode, all models see all messages
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
    
    // Get all assistant messages for the last user message
    const lastUserMessageIndex = [...sortedChatMessages]
      .reverse()
      .findIndex((msg) => msg.sender === "user");
    
    if (lastUserMessageIndex !== -1) {
      // Get messages after the last user message
      const messagesAfterLastUser = sortedChatMessages.slice(
        sortedChatMessages.length - lastUserMessageIndex
      );
      const assistantResponses = messagesAfterLastUser.filter(
        (msg) => msg.sender === "assistant"
      );

      // Check if this model is next in the sequence
      const respondedModels = new Set(
        assistantResponses.map((msg) => msg.modelId)
      );
      const isThisModelsTurn = !respondedModels.has(modelId);

      // Log detailed information about Round Robin state
      console.log(`ROUND_ROBIN mode - Analysis for model ${modelId}:`);
      console.log(`- Last user message index: ${lastUserMessageIndex}`);
      console.log(
        `- Already responded models: ${
          Array.from(respondedModels).join(", ") || "none"
        }`
      );
      console.log(
        `- Message stream for this model: ${
          isThisModelsTurn ? "ACTIVE" : "ON HOLD"
        }`
      );

      console.log(
        `ROUND_ROBIN mode: It ${
          isThisModelsTurn ? "is" : "is not"
        } ${modelId}'s turn to respond`
      );
    }
    
    // In Round Robin mode, models always see all messages
    return sortedChatMessages;
  }
  
  // Find which model should respond next in round robin sequence
  private _getNextModelInSequence(chatId: string, modelIds: string[]): string | null {
    const currentChat = this.deps.getChat(chatId);
    if (!currentChat || currentChat.messages.length === 0) return modelIds[0];
    
    // Sort messages by timestamp
    const sortedMessages = [...currentChat.messages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    
    // Find the last user message
    const lastUserMessageIndex = [...sortedMessages]
      .reverse()
      .findIndex((msg) => msg.sender === "user");
    
    if (lastUserMessageIndex === -1) {
      // No user messages, return the first model
      return modelIds[0];
    }
    
    // Get messages after the last user message
    const messagesAfterLastUser = sortedMessages.slice(
      sortedMessages.length - lastUserMessageIndex
    );
    const assistantResponses = messagesAfterLastUser.filter(
      (msg) => msg.sender === "assistant"
    );
    
    // Get all models that have already responded
    const respondedModels = new Set(
      assistantResponses.map((msg) => msg.modelId || "")
    );
    
    // Find the first model that hasn't responded yet
    for (const modelId of modelIds) {
      if (!respondedModels.has(modelId)) {
        return modelId;
      }
    }
    
    // If all models have responded or no valid models, return null
    return null;
  }
  
  // Handle sending a message in round robin mode
  public async handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]> {
    console.log(`Starting Round Robin conversation mode with ${modelIds.length} models`);
    
    // Create a copy of model IDs in the order they should respond
    const orderedModelIds = [...modelIds];
    
    // Create message placeholders for all models
    const messagePromises = orderedModelIds.map((modelId, index) => {
      return this.createModelMessage(chatId, modelId, index)
        .then(assistantMessageId => {
          // Only start the first model talking right away
          if (index === 0) {
            // Mark first message as streaming
            this.streamHandlers.setStreamingMessageIds((prev) => [
              ...prev,
              assistantMessageId,
            ]);
            
            // Start the first model with a slight delay
            setTimeout(() => {
              this.callLLMApi(chatId, assistantMessageId, modelId, {
                content,
                temperature,
                systemPrompt: this.systemPrompt,
              })
                .then(() => {
                  // When it's done, trigger the next model in sequence
                  console.log(
                    `Model ${modelId} finished. Starting next model in Round Robin sequence.`
                  );
                  
                  if (index + 1 < orderedModelIds.length) {
                    const nextModelId = orderedModelIds[index + 1];
                    const nextMessageId = `msg_${
                      Date.now() + index + 1
                    }_${nextModelId}`;
                    
                    // Mark next message as streaming
                    this.streamHandlers.setStreamingMessageIds((prev) => [
                      ...prev,
                      nextMessageId,
                    ]);
                    
                    // Call the next model
                    this.callLLMApi(chatId, nextMessageId, nextModelId, {
                      content,
                      temperature,
                      systemPrompt: this.systemPrompt,
                    }).catch((error) => {
                      console.error(
                        `Error in sequential API call for ${nextModelId}:`,
                        error
                      );
                      this.streamHandlers.setStreamingMessageIds((prev) =>
                        prev.filter((id) => id !== nextMessageId)
                      );
                    });
                  }
                })
                .catch((error) => {
                  console.error(
                    `Error in API call for ${modelId}:`,
                    error
                  );
                  this.streamHandlers.setStreamingMessageIds((prev) =>
                    prev.filter((id) => id !== assistantMessageId)
                  );
                });
            }, 100);
          }
          
          return assistantMessageId;
        });
    });
    
    return Promise.all(messagePromises);
  }
}