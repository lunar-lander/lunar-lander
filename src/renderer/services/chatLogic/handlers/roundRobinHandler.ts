import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class RoundRobinChatHandler extends BaseChatHandler {
  private activeRoundRobinIndex: number = 0;
  private completedMessages: Set<string> = new Set();
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }
  
  // Filter messages for round robin mode
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
    
    // Get the latest user message
    const lastUserMessage = [...sortedChatMessages]
      .reverse()
      .find((msg) => msg.sender === "user");
    
    // Get all assistant messages that are part of the current round robin "turn"
    // i.e., responses to the latest user message
    const latestConversationTurn: ChatMessage[] = [];
    
    if (lastUserMessage) {
      // First add the user message
      latestConversationTurn.push(lastUserMessage);
      
      // Then add all assistant messages that came after this user message
      // These are the messages from other models in this round robin turn
      const isAfterLastUserMessage = (msg: ChatMessage) => 
        msg.timestamp > lastUserMessage.timestamp && 
        msg.sender === "assistant";
      
      const assistantMessagesThisTurn = sortedChatMessages
        .filter(isAfterLastUserMessage)
        .sort((a, b) => a.timestamp - b.timestamp);
      
      latestConversationTurn.push(...assistantMessagesThisTurn);
      
      console.log(`ROUND_ROBIN mode - Model ${modelId} will see:`);
      console.log(`- Last user message: "${lastUserMessage.content.substring(0, 30)}..."`);
      console.log(`- ${assistantMessagesThisTurn.length} previous AI responses in this turn`);
      if (assistantMessagesThisTurn.length > 0) {
        assistantMessagesThisTurn.forEach((msg, i) => {
          const modelName = this.deps.models.find(m => m.id === msg.modelId)?.name || msg.modelId;
          console.log(`  ${i+1}. ${modelName}: "${msg.content.substring(0, 30)}..."`);
        });
      }
    } else {
      console.log(`ROUND_ROBIN mode - No user message found, model ${modelId} will see all messages`);
      return sortedChatMessages;
    }
    
    // For round robin, we include:
    // 1. The full conversation history before the latest user message
    // 2. The latest user message
    // 3. All AI responses to that message that came before this model's turn
    
    // Get all messages before the latest user message for context
    const messagesBeforeLatestTurn = lastUserMessage 
      ? sortedChatMessages.filter(msg => msg.timestamp < lastUserMessage.timestamp)
      : sortedChatMessages;
    
    // Combine the previous history with the current turn
    const filteredMessages = [...messagesBeforeLatestTurn, ...latestConversationTurn];
    
    console.log(`ROUND_ROBIN mode: Model ${modelId} will see ${filteredMessages.length} total messages`);
    
    return filteredMessages;
  }
  
  // Process models in sequence, each one building on previous responses
  public async handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]> {
    if (modelIds.length === 0) return [];
    
    console.log(`Starting Round Robin conversation mode with ${modelIds.length} models in sequence`);
    
    // Reset round robin state
    this.activeRoundRobinIndex = 0;
    this.completedMessages.clear();
    
    // Create placeholder messages for all models but only start the first one
    const allMessageIds: string[] = [];
    
    // Create first model message and start processing
    const firstModelId = modelIds[0];
    const firstMessageId = await this.createModelMessage(chatId, firstModelId, 0);
    allMessageIds.push(firstMessageId);
    
    // Create placeholder messages for remaining models (will be processed later)
    for (let i = 1; i < modelIds.length; i++) {
      const modelId = modelIds[i];
      const messageId = await this.createModelMessage(chatId, modelId, i);
      allMessageIds.push(messageId);
    }
    
    // Start the first model
    this.startNextModelInSequence(
      chatId, 
      content, 
      temperature, 
      modelIds, 
      allMessageIds
    );
    
    return allMessageIds;
  }
  
  // Helper method to start the next model in the sequence
  private startNextModelInSequence(
    chatId: string,
    userContent: string,
    temperature: number,
    modelIds: string[],
    messageIds: string[]
  ) {
    // If we've processed all models, we're done
    if (this.activeRoundRobinIndex >= modelIds.length) {
      console.log(`Round Robin complete - all ${modelIds.length} models have responded`);
      return;
    }
    
    const currentModelId = modelIds[this.activeRoundRobinIndex];
    const currentMessageId = messageIds[this.activeRoundRobinIndex];
    
    console.log(`Starting model ${this.activeRoundRobinIndex + 1}/${modelIds.length}: ${currentModelId}`);
    
    // Mark message as streaming
    this.streamHandlers.setStreamingMessageIds(
      prev => [...prev, currentMessageId]
    );
    
    // Call the API with a short delay to ensure state is updated
    setTimeout(() => {
      this.callLLMApi(
        chatId, 
        currentMessageId, 
        currentModelId, 
        {
          content: userContent,
          temperature,
          systemPrompt: this.systemPrompt
        }
      ).then(() => {
        // When this model finishes, mark it as completed
        this.completedMessages.add(currentMessageId);
        console.log(`Model ${currentModelId} completed (${this.activeRoundRobinIndex + 1}/${modelIds.length})`);
        
        // Move to the next model
        this.activeRoundRobinIndex++;
        
        // Start the next model in sequence
        this.startNextModelInSequence(
          chatId,
          userContent,
          temperature,
          modelIds,
          messageIds
        );
      }).catch(error => {
        console.error(`Error in Round Robin API call for ${currentModelId}:`, error);
        
        // Even if there's an error, move to the next model
        this.streamHandlers.setStreamingMessageIds(
          prev => prev.filter(id => id !== currentMessageId)
        );
        
        this.activeRoundRobinIndex++;
        this.startNextModelInSequence(
          chatId,
          userContent,
          temperature,
          modelIds,
          messageIds
        );
      });
    }, 100);
  }
}
