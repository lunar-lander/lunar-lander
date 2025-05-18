import { ConversationModeType } from "../../components/Settings/ConversationMode";
import { ChatMessage } from "../../../shared/types/chat";

// Interface for a conversation mode handler
export interface ConversationModeHandler {
  // Process messages for the given model based on the conversation mode
  filterMessages: (
    allMessages: ChatMessage[],
    modelId: string
  ) => ChatMessage[];
  
  // Determine if the model should respond in this mode
  shouldModelRespond: (
    allMessages: ChatMessage[],
    modelId: string
  ) => boolean;
  
  // Handle next model selection (for sequential modes)
  getNextModelToRespond?: (
    allMessages: ChatMessage[],
    allModelIds: string[]
  ) => string | null;
  
  // Get a description of what this mode does
  getDescription: () => string;
}

// Base implementation for isolated mode
export class IsolatedModeHandler implements ConversationModeHandler {
  filterMessages(allMessages: ChatMessage[], modelId: string): ChatMessage[] {
    // Sort messages by timestamp to maintain correct ordering
    const sortedMessages = [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
    
    // In isolated mode, models only see user messages and their own previous responses
    const userMessages = sortedMessages.filter(msg => msg.sender === "user");
    const thisModelMessages = sortedMessages.filter(
      msg => msg.sender === "assistant" && msg.modelId === modelId
    );
    
    // Combine and ensure proper ordering
    return [...userMessages, ...thisModelMessages].sort((a, b) => a.timestamp - b.timestamp);
  }
  
  shouldModelRespond(): boolean {
    // In isolated mode, all selected models should respond
    return true;
  }
  
  getDescription(): string {
    return "Isolated mode: Each model only sees user messages and its own previous responses";
  }
}

// Base implementation for discuss mode
export class DiscussModeHandler implements ConversationModeHandler {
  filterMessages(allMessages: ChatMessage[]): ChatMessage[] {
    // In discuss mode, all models see all messages
    // Just sort by timestamp to ensure correct ordering
    return [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
  }
  
  shouldModelRespond(): boolean {
    // In discuss mode, all selected models should respond
    return true;
  }
  
  getDescription(): string {
    return "Discuss mode: All models see all messages and respond concurrently";
  }
}

// Base implementation for round robin mode
export class RoundRobinModeHandler implements ConversationModeHandler {
  filterMessages(allMessages: ChatMessage[]): ChatMessage[] {
    // In round robin mode, all models see all messages
    // Just sort by timestamp to ensure correct ordering
    return [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
  }
  
  shouldModelRespond(allMessages: ChatMessage[], modelId: string): boolean {
    // Sort messages by timestamp
    const sortedMessages = [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
    
    // Find the last user message
    const lastUserMessageIndex = [...sortedMessages]
      .reverse()
      .findIndex(msg => msg.sender === "user");
    
    if (lastUserMessageIndex === -1) return true; // If no user messages, all models can respond
    
    // Get all assistant messages after the last user message
    const messagesAfterLastUser = sortedMessages.slice(
      sortedMessages.length - lastUserMessageIndex
    );
    const assistantResponses = messagesAfterLastUser.filter(
      msg => msg.sender === "assistant"
    );
    
    // Check if this model has already responded
    const respondedModels = new Set(
      assistantResponses.map(msg => msg.modelId)
    );
    
    // This model should respond if it hasn't responded yet
    return !respondedModels.has(modelId);
  }
  
  getNextModelToRespond(allMessages: ChatMessage[], allModelIds: string[]): string | null {
    // Find all models that haven't responded yet
    const sortedMessages = [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
    
    // Find the last user message
    const lastUserMessageIndex = [...sortedMessages]
      .reverse()
      .findIndex(msg => msg.sender === "user");
    
    if (lastUserMessageIndex === -1) {
      // If no user messages, return the first model
      return allModelIds.length > 0 ? allModelIds[0] : null;
    }
    
    // Get all assistant messages after the last user message
    const messagesAfterLastUser = sortedMessages.slice(
      sortedMessages.length - lastUserMessageIndex
    );
    const assistantResponses = messagesAfterLastUser.filter(
      msg => msg.sender === "assistant"
    );
    
    // Get all models that have already responded
    const respondedModels = new Set(
      assistantResponses.map(msg => msg.modelId)
    );
    
    // Find the first model that hasn't responded yet
    for (const modelId of allModelIds) {
      if (!respondedModels.has(modelId)) {
        return modelId;
      }
    }
    
    // If all models have responded, return null
    return null;
  }
  
  getDescription(): string {
    return "Round Robin mode: Models respond one at a time in sequence";
  }
}

// Factory function to get the appropriate handler for a given mode
export function getConversationModeHandler(mode: ConversationModeType): ConversationModeHandler {
  switch (mode) {
    case ConversationModeType.ISOLATED:
      return new IsolatedModeHandler();
    case ConversationModeType.DISCUSS:
      return new DiscussModeHandler();
    case ConversationModeType.ROUND_ROBIN:
      return new RoundRobinModeHandler();
    case ConversationModeType.CUSTOM:
      // For now, default to discuss mode for custom
      // In the future, this could be dynamically created based on custom rules
      return new DiscussModeHandler();
    default:
      return new IsolatedModeHandler();
  }
}