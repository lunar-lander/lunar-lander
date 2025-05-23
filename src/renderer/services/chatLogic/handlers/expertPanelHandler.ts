import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class ExpertPanelHandler extends BaseChatHandler {
  private expertRoles = [
    {
      role: "Research Scientist",
      description: "Focus on empirical evidence, research methodologies, and scientific rigor. Cite relevant studies and data."
    },
    {
      role: "Systems Engineer", 
      description: "Analyze from a technical implementation perspective. Consider scalability, efficiency, and practical constraints."
    },
    {
      role: "Philosophy Expert",
      description: "Examine ethical implications, logical frameworks, and fundamental principles. Question assumptions."
    },
    {
      role: "Business Strategist",
      description: "Evaluate commercial viability, market implications, and practical business considerations."
    },
    {
      role: "User Experience Designer",
      description: "Focus on human-centered design, usability, accessibility, and user needs."
    },
    {
      role: "Risk Analyst",
      description: "Identify potential risks, vulnerabilities, and unintended consequences. Assess probability and impact."
    },
    {
      role: "Creative Innovator",
      description: "Think outside the box with novel approaches, alternative solutions, and creative perspectives."
    },
    {
      role: "Policy Expert",
      description: "Consider regulatory compliance, legal implications, and governance frameworks."
    }
  ];
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }
  
  // Filter messages for expert panel mode
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
      `EXPERT_PANEL mode: Model ${modelId} will see ${sortedChatMessages.length} messages`
    );
    
    return sortedChatMessages;
  }
  
  // Get expert role and system prompt for a specific model
  private getExpertSystemPrompt(modelIndex: number): string {
    const role = this.expertRoles[modelIndex % this.expertRoles.length];
    
    return `${this.systemPrompt}

EXPERT PANEL MODE - ${role.role.toUpperCase()}:
You are participating in an expert panel discussion as a ${role.role}.

Your specialized perspective: ${role.description}

Guidelines for your response:
- Respond primarily from your assigned expert perspective
- Draw on knowledge and methodologies specific to your field
- Use terminology and frameworks relevant to your expertise
- Consider how other experts' viewpoints relate to your field
- Acknowledge when topics fall outside your primary expertise
- Maintain professional credibility while being accessible
- Build on insights from other experts when they align with your field

Remember: You are the ${role.role} on this panel. Provide the insights that only someone with your expertise would offer.`;
  }
  
  // Handle sending a message in expert panel mode
  public async handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]> {
    console.log(`EXPERT PANEL: Starting panel discussion with ${modelIds.length} experts`);
    
    // Create expert responses from each model with their assigned role
    const messagePromises = modelIds.map((modelId, index) => {
      const role = this.expertRoles[index % this.expertRoles.length];
      
      return this.createModelMessage(chatId, modelId, index)
        .then(assistantMessageId => {
          // Mark message as streaming
          this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);
          
          console.log(`Assigning ${role.role} role to model ${modelId}`);
          
          // Start API call with expert role
          setTimeout(() => {
            this.callLLMApi(chatId, assistantMessageId, modelId, {
              content,
              temperature,
              systemPrompt: this.getExpertSystemPrompt(index),
            }).catch((error) => {
              console.error(`Error in expert panel API call for ${modelId} (${role.role}):`, error);
              
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