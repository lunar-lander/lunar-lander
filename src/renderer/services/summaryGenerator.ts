import { Chat, ChatMessage } from '../../shared/types/chat';
import { Model } from '../../shared/types/model';
import { DbService } from './db';

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

    try {
      // Get up to the first 5 message exchanges
      const messagesToInclude = chat.messages.slice(0, 10);
      
      // Get the model configuration
      const model = DbService.getModel(modelId);
      if (!model) {
        console.error("Model not found:", modelId);
        return this.generateBasicSummary(chat);
      }
      
      // Call the LLM API
      return await this.callSummaryLLM(messagesToInclude, model);
    } catch (error) {
      console.error("Error generating summary:", error);
      return this.generateBasicSummary(chat);
    }
  }
  
  /**
   * Call the LLM API to generate a summary
   */
  private static async callSummaryLLM(messages: ChatMessage[], model: Model): Promise<string> {
    // Prepare the messages for the API
    const apiMessages = [
      { 
        role: 'system', 
        content: 'You are a helpful assistant. Your task is to create a short, concise title for this conversation. The title should be 5-8 words maximum and capture the main topic being discussed. Return ONLY the title with no quotes, explanations, or additional text.'
      }
    ];
    
    // Add the conversation messages
    messages.forEach(message => {
      if (message.sender === 'user') {
        apiMessages.push({
          role: 'user',
          content: message.content
        });
      } else if (message.sender === 'assistant') {
        apiMessages.push({
          role: 'assistant',
          content: message.content
        });
      }
    });
    
    try {
      console.log(`Making summary API call to ${model.baseUrl} for model ${model.modelName}`);
      
      // Set up timeout to prevent long-running requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      // Make the API call
      const response = await fetch(`${model.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`
        },
        body: JSON.stringify({
          model: model.modelName,
          messages: apiMessages,
          max_tokens: 60,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `API returned status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("API error:", errorData);
          errorMessage += `: ${errorData.error?.message || 'Unknown error'}`;
        } catch (parseError) {
          console.error("Error parsing API error response:", parseError);
          errorMessage += `: ${await response.text() || 'Unknown error'}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (!data.choices || !data.choices.length || !data.choices[0].message) {
        console.error("Invalid API response:", data);
        throw new Error("Invalid API response format");
      }
      
      const summary = data.choices[0].message.content.trim();
      console.log(`Summary API returned: "${summary}"`);
      return summary;
    } catch (error) {
      // Handle timeout errors explicitly
      if (error.name === 'AbortError') {
        console.error("Summary API call timed out");
        return "New conversation"; // Fallback for timeout
      }
      
      console.error("Error calling summary LLM API:", error);
      // Return a safe fallback instead of throwing
      return "New conversation";
    }
  }
}