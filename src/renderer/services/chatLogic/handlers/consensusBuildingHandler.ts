import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class ConsensusBuildingHandler extends BaseChatHandler {
  private currentRound = 1;
  private maxRounds = 3;
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }
  
  // Filter messages for consensus building mode
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
    
    // Add model attribution to assistant messages for consensus building context
    const enhancedMessages = sortedChatMessages.map(msg => {
      if (msg.sender === "assistant" && msg.modelId) {
        const model = this.deps.models.find(m => m.id === msg.modelId);
        const modelName = model ? model.name : `Model ${msg.modelId}`;
        
        // Only add attribution if it's not already there
        if (!msg.content.startsWith(`[${modelName}`)) {
          return {
            ...msg,
            content: `[${modelName}]: ${msg.content}`
          };
        }
      }
      return msg;
    });
    
    console.log(
      `CONSENSUS_BUILDING mode: Model ${modelId} will see ${enhancedMessages.length} messages with model attribution`
    );
    
    return enhancedMessages;
  }
  
  // Determine which round of consensus building this is
  private getCurrentRound(chatMessages: ChatMessage[]): number {
    const userMessages = chatMessages.filter(msg => msg.sender === "user");
    return Math.max(1, userMessages.length);
  }
  
  // Get consensus building system prompt based on round
  private getConsensusBuildingSystemPrompt(round: number, modelIndex: number): string {
    let roundInstructions: string;
    
    switch (round) {
      case 1:
        roundInstructions = `INITIAL POSITION ROUND:
- Present your initial perspective on the topic
- Share your reasoning and key considerations
- Identify potential areas where others might disagree
- Be open to having your mind changed by good arguments
- End with 2-3 specific questions you'd like other participants to address`;
        break;
        
      case 2:
        roundInstructions = `CONVERGENCE ROUND:
- Review the initial positions from other participants
- Identify areas where you agree with others
- Address the specific questions others have raised
- Acknowledge valid points that have shifted your thinking
- Present a refined position that incorporates insights from others
- Highlight remaining areas of disagreement that need resolution`;
        break;
        
      case 3:
        roundInstructions = `CONSENSUS ROUND:
- Work toward finding common ground and shared understanding
- Propose specific compromises or synthesis solutions
- Address any remaining disagreements constructively
- Focus on practical solutions everyone can support
- If full consensus isn't possible, clearly articulate the remaining differences
- Summarize the collective wisdom that has emerged`;
        break;
        
      default:
        roundInstructions = `CONTINUED CONSENSUS BUILDING:
- Continue working toward greater alignment
- Build on the progress made in previous rounds
- Address any new concerns that have emerged
- Focus on practical next steps and implementation`;
    }
    
    return `${this.systemPrompt}

CONSENSUS BUILDING MODE - ROUND ${round}:
You are participating in a consensus-building discussion aimed at finding shared understanding and agreement.

${roundInstructions}

Core Principles:
- Approach this collaboratively, not competitively
- Listen to understand, not just to respond
- Be willing to change your position when presented with compelling arguments
- Look for win-win solutions and creative compromises
- Acknowledge the validity in others' perspectives
- Focus on shared values and common goals
- Be specific about where you agree and where you still have concerns

Remember: The goal is not to "win" but to find the best collective solution through respectful dialogue and mutual understanding.`;
  }
  
  // Handle sending a message in consensus building mode
  public async handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]> {
    // Determine current round based on existing messages
    const currentChat = this.deps.getChat(chatId);
    const round = currentChat ? this.getCurrentRound(currentChat.messages) : 1;
    
    console.log(`CONSENSUS BUILDING: Starting Round ${round} with ${modelIds.length} participants`);
    
    // Create consensus building responses from each model
    const messagePromises = modelIds.map((modelId, index) => {
      return this.createModelMessage(chatId, modelId, index)
        .then(assistantMessageId => {
          // Mark message as streaming
          this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);
          
          console.log(`Round ${round} - Model ${modelId} participating in consensus building`);
          
          // Start API call with consensus building approach
          setTimeout(() => {
            this.callLLMApi(chatId, assistantMessageId, modelId, {
              content,
              temperature: temperature,
              systemPrompt: this.getConsensusBuildingSystemPrompt(round, index),
            }).catch((error) => {
              console.error(`Error in consensus building API call for ${modelId}:`, error);
              
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