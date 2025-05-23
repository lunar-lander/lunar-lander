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

    let summary = firstUserMessage.content;
    
    // Clean up the message content
    summary = summary
      .replace(/\n+/g, ' ')  // Replace newlines with spaces
      .replace(/\s+/g, ' ')  // Collapse multiple spaces
      .trim();
    
    // Try to extract the main topic from the first sentence
    const sentences = summary.split(/[.!?]+/);
    if (sentences.length > 0 && sentences[0].trim()) {
      summary = sentences[0].trim();
    }
    
    // Truncate intelligently - prefer to break at word boundaries
    const maxLength = 50;
    if (summary.length > maxLength) {
      const words = summary.split(' ');
      let truncated = '';
      for (const word of words) {
        if ((truncated + ' ' + word).length > maxLength) {
          break;
        }
        truncated = truncated ? truncated + ' ' + word : word;
      }
      summary = truncated + (truncated !== summary ? '...' : '');
    }

    return summary || 'New conversation';
  }

  /**
   * Generate a summary using an LLM
   */
  static async generateLLMSummary(chat: Chat, modelId: string, isRegeneration: boolean = false): Promise<string> {
    if (!chat.messages.length) {
      return 'New conversation';
    }

    try {
      let messagesToInclude: ChatMessage[];
      
      if (isRegeneration) {
        // For regeneration, consider the entire conversation but intelligently sample
        messagesToInclude = this.selectMessagesForFullSummary(chat.messages);
      } else {
        // For initial summary, just use first few exchanges
        messagesToInclude = chat.messages.slice(0, 10);
      }

      // Get the model configuration
      const model = DbService.getModel(modelId);
      if (!model) {
        console.error("Model not found:", modelId);
        return this.generateBasicSummary(chat);
      }

      // Call the LLM API
      return await this.callSummaryLLM(messagesToInclude, model, isRegeneration);
    } catch (error) {
      console.error("Error generating summary:", error);
      return this.generateBasicSummary(chat);
    }
  }

  /**
   * Intelligently select messages for full conversation summary
   */
  private static selectMessagesForFullSummary(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length <= 15) {
      // If conversation is short, include all messages
      return messages;
    }

    // For longer conversations, include:
    // - First 3 exchanges (6 messages)
    // - Last 3 exchanges (6 messages) 
    // - A few key messages from the middle
    const result: ChatMessage[] = [];
    
    // Add first 6 messages
    result.push(...messages.slice(0, 6));
    
    // Add some middle messages if conversation is long enough
    if (messages.length > 20) {
      const middleStart = Math.floor(messages.length / 2) - 2;
      result.push(...messages.slice(middleStart, middleStart + 4));
    }
    
    // Add last 6 messages (avoid duplicates)
    const lastMessages = messages.slice(-6);
    const lastStartIndex = Math.max(result.length, messages.length - 6);
    result.push(...messages.slice(lastStartIndex));
    
    return result;
  }

  /**
   * Call the LLM API to generate a summary
   */
  private static async callSummaryLLM(messages: ChatMessage[], model: Model, isRegeneration: boolean = false): Promise<string> {
    // Prepare the messages for the API
    const systemPrompt = isRegeneration 
      ? 'Create a concise, descriptive title that captures the overall conversation topic and evolution. Requirements:\n- Maximum 6 words\n- Reflect the main themes discussed throughout the conversation\n- Consider how the topic developed or evolved\n- Use present tense when possible\n- Avoid generic words like "help", "question", "discussion"\n- Return ONLY the title with no quotes, punctuation, or extra text\n\nExamples:\n"Python basics to advanced deployment" → "Python Learning Journey"\n"Database design then optimization" → "Database Architecture Optimization"\n"React bug to performance tuning" → "React Performance Enhancement"'
      : 'Create a concise, descriptive title for this conversation. Requirements:\n- Maximum 6 words\n- Focus on the main topic or question\n- Use present tense when possible\n- Avoid generic words like "help", "question", "discussion"\n- Return ONLY the title with no quotes, punctuation, or extra text\n\nExamples:\n"Fix React component bug" → "React Component Rendering Issue"\n"How to learn Python" → "Python Learning Resources"\n"Database design advice" → "Database Schema Design"';

    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
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
          max_tokens: 30,
          temperature: 0.3
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