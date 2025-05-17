import { Chat, ChatMessage } from '../../shared/types/chat';

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
   * Generate a summary using an LLM
   */
  static async generateLLMSummary(chat: Chat, modelId: string): Promise<string> {
    if (!chat.messages.length) {
      return 'New conversation';
    }

    // In a real implementation, this would call the LLM API
    // For now, we'll simulate it with a delay and some logic
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get the first user message and first assistant message
        const userMessages = chat.messages.filter(msg => msg.sender === 'user');
        const assistantMessages = chat.messages.filter(msg => msg.sender === 'assistant');
        
        const firstUserMessage = userMessages[0];
        const firstAssistantMessage = assistantMessages[0];
        
        if (!firstUserMessage) {
          resolve('New conversation');
          return;
        }
        
        // Try to create a more interesting summary using both user and assistant messages
        const userContent = firstUserMessage.content;
        const assistantContent = firstAssistantMessage?.content || '';
        
        // Process user message for keywords
        const userWords = userContent.split(' ');
        const userKeywords = userWords.filter(word => 
          word.length > 5 &&
          !['should', 'would', 'could', 'about', 'there', 'their', 'these', 'those'].includes(word.toLowerCase())
        );
        
        // Process assistant message for keywords if available
        const assistantWords = assistantContent.split(' ');
        const assistantKeywords = assistantWords.filter(word => 
          word.length > 5 &&
          !['should', 'would', 'could', 'about', 'there', 'their', 'these', 'those'].includes(word.toLowerCase())
        );
        
        // Combine keywords from both messages
        let allKeywords = [...userKeywords];
        if (assistantKeywords.length > 0) {
          // Add a couple keywords from assistant response
          allKeywords = [...allKeywords, ...assistantKeywords.slice(0, 2)];
        }
        
        if (allKeywords.length > 0) {
          // Take a couple keywords and create a summary
          const selectedKeywords = allKeywords.slice(0, 3);
          const capitalized = selectedKeywords.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase().replace(/[.,;:!?]$/, '')
          );
          
          // Create different summaries based on content patterns
          if (userContent.includes('?')) {
            resolve(`Question about ${capitalized.join(' and ')}`);
          } else if (userKeywords.some(word => word.toLowerCase().includes('help'))) {
            resolve(`Help with ${capitalized.join(' and ')}`);
          } else if (assistantContent && assistantContent.toLowerCase().includes('here is')) {
            resolve(`Explanation of ${capitalized.join(' and ')}`);
          } else if (assistantContent && assistantContent.toLowerCase().includes('suggest')) {
            resolve(`Suggestions for ${capitalized.join(' and ')}`);
          } else {
            resolve(`Discussion about ${capitalized.join(' and ')}`);
          }
        } else {
          // Fall back to basic summary
          resolve(this.generateBasicSummary(chat));
        }
      }, 1000); // Simulate API delay
    });
  }
  
  /**
   * In a real application, this would be the method to actually call the LLM API
   */
  private static async callSummaryLLM(message: string, modelId: string): Promise<string> {
    // This would be implemented to call the LLM API
    // For now we'll just return a placeholder
    return `Summary of: ${message.substring(0, 30)}...`;
  }
}