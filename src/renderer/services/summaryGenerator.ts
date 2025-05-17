import { Chat } from '../../shared/types/chat';

// Utility to generate a summary of a chat conversation
export class SummaryGenerator {
  /**
   * Generate a summary from a chat based on the first user message
   */
  static generateBasicSummary(chat: Chat): string {
    if (!chat.messages.length) {
      return 'New conversation';
    }

    // Find the first user message
    const firstUserMessage = chat.messages.find(msg => msg.sender === 'user');
    if (!firstUserMessage) {
      return 'New conversation';
    }

    // Truncate and return as summary
    const maxLength = 60;
    let summary = firstUserMessage.content;
    
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...';
    }
    
    return summary;
  }

  /**
   * For future implementation:
   * Generate a summary using an LLM by sending it the conversation
   */
  static async generateLLMSummary(chat: Chat, _modelId: string): Promise<string> {
    // This is a placeholder for integrating with an LLM-based summarization
    // Will be implemented when the LLM integration is ready
    return this.generateBasicSummary(chat);
  }
}