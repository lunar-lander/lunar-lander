import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class DebateHandler extends BaseChatHandler {
  private debatePositions = [
    "Advocate (Pro)",
    "Critic (Con)", 
    "Skeptical Analyst",
    "Devil's Advocate",
    "Pragmatic Realist",
    "Idealistic Visionary"
  ];
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }
  
  // Filter messages for debate mode
  public filterMessages(chatId: string, messageId: string, modelId: string): ChatMessage[] {
    const currentChat = this.deps.getChat(chatId);
    if (!currentChat) return [];
    
    // Filter out the current message being processed
    const chatMessages = currentChat.messages.filter(
      (msg) => msg.id !== messageId
    );
    
    // Sort messages by timestamp to maintain correct ordering
    const sortedChatMessages = [...chatMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    
    console.log(
      `DEBATE mode: Model ${modelId} will see ${sortedChatMessages.length} messages for debate context`
    );
    
    return sortedChatMessages;
  }
  
  // Get debate position and system prompt for a specific model
  private getDebateSystemPrompt(modelIndex: number, totalModels: number): string {
    let position: string;
    let instructions: string;
    
    if (totalModels === 2) {
      // For 2 models, simple pro/con
      position = modelIndex === 0 ? "Advocate (Pro)" : "Critic (Con)";
      instructions = modelIndex === 0 
        ? "Argue in favor of the topic/proposal. Present the strongest possible case for why this is beneficial, correct, or should be implemented."
        : "Argue against the topic/proposal. Present the strongest possible case for why this is problematic, incorrect, or should not be implemented.";
    } else {
      // For more models, assign diverse positions
      position = this.debatePositions[modelIndex % this.debatePositions.length];
      
      switch (position) {
        case "Advocate (Pro)":
          instructions = "Argue strongly in favor. Present benefits, advantages, and positive outcomes. Build the strongest case for 'yes'.";
          break;
        case "Critic (Con)":
          instructions = "Argue strongly against. Present risks, disadvantages, and negative outcomes. Build the strongest case for 'no'.";
          break;
        case "Skeptical Analyst":
          instructions = "Question assumptions and examine evidence critically. Challenge weak arguments from all sides.";
          break;
        case "Devil's Advocate":
          instructions = "Take the contrarian position. Challenge the most popular viewpoints and present alternative perspectives.";
          break;
        case "Pragmatic Realist":
          instructions = "Focus on practical implementation, real-world constraints, and feasibility concerns.";
          break;
        case "Idealistic Visionary":
          instructions = "Present the ideal scenario and long-term potential. Focus on aspirational goals and transformative possibilities.";
          break;
        default:
          instructions = "Present a unique perspective on this topic.";
      }
    }
    
    return `${this.systemPrompt}

DEBATE MODE - ${position.toUpperCase()}:
You are participating in a structured debate as the ${position}.

Your role: ${instructions}

Debate Guidelines:
- Stay committed to your assigned position throughout the discussion
- Present strong, evidence-based arguments
- Acknowledge valid points from opponents while maintaining your stance
- Use logical reasoning and, when applicable, cite examples or data
- Be respectful but assertive in your argumentation
- Directly address and counter opposing arguments when you can see them
- If this is a follow-up round, respond to specific points made by other debaters
- Structure your argument clearly with main points and supporting evidence

Current debate position: ${position}
Maintain this perspective consistently while engaging constructively with other viewpoints.`;
  }
  
  // Handle sending a message in debate mode
  public async handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]> {
    console.log(`DEBATE: Starting debate with ${modelIds.length} participants`);
    
    // Create debate responses from each model with their assigned position
    const messagePromises = modelIds.map((modelId, index) => {
      const position = this.debatePositions[index % this.debatePositions.length];
      
      return this.createModelMessage(chatId, modelId, index)
        .then(assistantMessageId => {
          // Mark message as streaming
          this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);
          
          console.log(`Assigning ${position} position to model ${modelId}`);
          
          // Start API call with debate position
          setTimeout(() => {
            this.callLLMApi(chatId, assistantMessageId, modelId, {
              content,
              temperature: temperature * 1.1, // Slightly higher temperature for more dynamic debate
              systemPrompt: this.getDebateSystemPrompt(index, modelIds.length),
            }).catch((error) => {
              console.error(`Error in debate API call for ${modelId} (${position}):`, error);
              
              // Cleanup streaming state on error
              this.streamHandlers.setStreamingMessageIds((prev) =>
                prev.filter((id) => id !== assistantMessageId)
              );
            });
          }, 100 * index); // Stagger slightly
          
          return assistantMessageId;
        });
    });
    
    return Promise.all(messagePromises);
  }
}