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

    // This would call the actual LLM API in a real implementation
    // Here we're generating a more sophisticated summary
    
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Get all messages up to a point
          const userMessages = chat.messages.filter(msg => msg.sender === 'user');
          const assistantMessages = chat.messages.filter(msg => msg.sender === 'assistant');
          
          const firstUserMessage = userMessages[0];
          const firstAssistantMessage = assistantMessages[0];
          
          if (!firstUserMessage) {
            resolve('New conversation');
            return;
          }
          
          // Extract key information from both user and assistant messages
          const userContent = firstUserMessage.content;
          const assistantContent = firstAssistantMessage?.content || '';
          
          // Check if message contains code
          const containsCode = userContent.includes('```') || assistantContent.includes('```');
          
          // Check if it's a question
          const isQuestion = userContent.includes('?') || 
            userContent.toLowerCase().startsWith('how') ||
            userContent.toLowerCase().startsWith('what') ||
            userContent.toLowerCase().startsWith('why') ||
            userContent.toLowerCase().startsWith('when') ||
            userContent.toLowerCase().startsWith('where') ||
            userContent.toLowerCase().startsWith('who') ||
            userContent.toLowerCase().startsWith('which') ||
            userContent.toLowerCase().startsWith('can');
          
          // Determine message subject and type
          let messageSubject = '';
          
          // Process user message for keywords
          const userWords = userContent.split(/\s+/);
          const STOP_WORDS = ['should', 'would', 'could', 'about', 'there', 'their', 'these', 'those', 'from', 'with', 'have', 'here', 'that', 'this'];
          const userKeywords = userWords.filter(word => {
            const cleanWord = word.toLowerCase().replace(/[.,;:!?]$/, '');
            return cleanWord.length > 5 && !STOP_WORDS.includes(cleanWord);
          });
          
          // Process assistant message for keywords
          const assistantWords = assistantContent.split(/\s+/);
          const assistantKeywords = assistantWords.filter(word => {
            const cleanWord = word.toLowerCase().replace(/[.,;:!?]$/, '');
            return cleanWord.length > 5 && !STOP_WORDS.includes(cleanWord);
          });
          
          // Combine keywords
          let allKeywords = [...userKeywords];
          if (assistantKeywords.length > 0) {
            allKeywords = [...allKeywords, ...assistantKeywords.slice(0, 3)];
          }
          
          // Remove duplicates and take top 3
          const uniqueKeywords = [...new Set(allKeywords.map(word => 
            word.toLowerCase().replace(/[.,;:!?]$/, '')
          ))];
          
          const selectedKeywords = uniqueKeywords.slice(0, 3);
          const formattedKeywords = selectedKeywords.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          );
          
          // Generate a more intelligent summary based on content analysis
          let summaryType = '';
          
          if (containsCode) {
            summaryType = userContent.toLowerCase().includes('fix') || userContent.toLowerCase().includes('error') 
              ? 'Code fix for' 
              : 'Code example for';
          } else if (isQuestion) {
            summaryType = 'Question about';
          } else if (userContent.toLowerCase().includes('help')) {
            summaryType = 'Help with';
          } else if (assistantContent.toLowerCase().includes('example')) {
            summaryType = 'Examples of';
          } else if (assistantContent.toLowerCase().includes('explain') || assistantContent.toLowerCase().includes('explanation')) {
            summaryType = 'Explanation of';
          } else if (assistantContent.toLowerCase().includes('suggest') || assistantContent.toLowerCase().includes('recommendation')) {
            summaryType = 'Suggestions for';
          } else if (assistantContent.toLowerCase().includes('steps') || assistantContent.toLowerCase().includes('instructions')) {
            summaryType = 'Steps for';
          } else if (assistantContent.toLowerCase().includes('comparison') || assistantContent.toLowerCase().includes('difference')) {
            summaryType = 'Comparison of';
          } else {
            summaryType = 'Discussion about';
          }
          
          // Get topic from formattedKeywords
          const topic = formattedKeywords.length > 0 
            ? formattedKeywords.join(' and ')
            : userContent.substring(0, 30).trim() + (userContent.length > 30 ? '...' : '');
          
          resolve(`${summaryType} ${topic}`);
        } catch (error) {
          console.error("Error generating summary:", error);
          resolve(this.generateBasicSummary(chat));
        }
      }, 800);
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