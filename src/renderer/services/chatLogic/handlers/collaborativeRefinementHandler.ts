import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

export class CollaborativeRefinementHandler extends BaseChatHandler {
  private isRefinementPhase = false;
  private isSummaryPhase = false;

  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string
  ) {
    super(deps, streamHandlers, systemPrompt);
  }

  // Filter messages for collaborative refinement mode
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

    // Add model attribution to assistant messages for collaborative context
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
      `COLLABORATIVE_REFINEMENT mode: Model ${modelId} will see ${enhancedMessages.length} messages with model attribution`
    );

    return enhancedMessages;
  }

  // Enhanced system prompt based on the phase
  private getPhaseSystemPrompt(phase: 'initial' | 'refinement' | 'summary', modelIndex: number): string {
    const basePrompt = this.systemPrompt;

    switch (phase) {
      case 'initial':
        return `${basePrompt}

COLLABORATIVE REFINEMENT - INITIAL RESPONSE PHASE:
You are participating in a collaborative refinement discussion. This is the INITIAL response phase.
- Provide your best analysis and response to the user's question
- Be thorough but concise
- You will have a chance to refine your response after seeing other perspectives
- Focus on your unique insights and expertise`;

      case 'refinement':
        return `${basePrompt}

COLLABORATIVE REFINEMENT - REFINEMENT PHASE:
You are participating in a collaborative refinement discussion. This is the REFINEMENT phase.
- Review the other models' initial responses that you can see in the conversation
- Refine and improve your previous response by incorporating insights from others
- Address any gaps or disagreements you notice
- Build upon the collective knowledge while maintaining your unique perspective
- If you agree with others, synthesize and expand on shared insights
- If you disagree, respectfully explain your different viewpoint`;

      case 'summary':
        return `${basePrompt}

COLLABORATIVE REFINEMENT - SUMMARY PHASE:
You are the designated summarizer for this collaborative refinement discussion.
- Review ALL the initial responses and refinements from all models
- Create a comprehensive, well-structured final answer that synthesizes the best insights
- Resolve any conflicts or disagreements between the responses
- Provide a complete, authoritative answer that represents the collective wisdom
- Clearly organize the information and highlight key insights
- Ensure the summary is more valuable than any individual response`;

      default:
        return basePrompt;
    }
  }

  // Handle sending a message in collaborative refinement mode
  public async handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]> {
    if (modelIds.length === 0) {
      console.error("No models provided for collaborative refinement");
      return [];
    }

    const allMessageIds: string[] = [];

    // Phase 1: Initial responses from all models
    console.log("COLLABORATIVE REFINEMENT: Starting Phase 1 - Initial Responses");
    const initialPromises = modelIds.map((modelId, index) => {
      return this.createModelMessage(chatId, modelId, index)
        .then(assistantMessageId => {
          allMessageIds.push(assistantMessageId);

          // Mark message as streaming
          this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);

          // Start API call for initial response
          setTimeout(() => {
            this.callLLMApi(chatId, assistantMessageId, modelId, {
              content,
              temperature,
              systemPrompt: this.getPhaseSystemPrompt('initial', index),
            }).catch((error) => {
              console.error(`Error in initial API call for ${modelId}:`, error);
              this.streamHandlers.setStreamingMessageIds((prev) =>
                prev.filter((id) => id !== assistantMessageId)
              );
            });
          }, 100 * index); // Stagger slightly

          return assistantMessageId;
        });
    });

    // Wait for all initial responses to complete
    const initialMessageIds = await Promise.all(initialPromises);

    // Wait for streaming to complete before proceeding to refinement phase
    await this.waitForStreamingComplete();

    // Phase 2: Refinement responses from all models
    console.log("COLLABORATIVE REFINEMENT: Starting Phase 2 - Refinement Responses");
    const refinementPromises = modelIds.map((modelId, index) => {
      return this.createModelMessage(chatId, modelId, index + modelIds.length)
        .then(assistantMessageId => {
          allMessageIds.push(assistantMessageId);

          // Mark message as streaming
          this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);

          // Start API call for refinement
          setTimeout(() => {
            this.callLLMApi(chatId, assistantMessageId, modelId, {
              content: "Please refine your previous response based on the other perspectives you can see.",
              temperature: temperature * 0.8, // Slightly lower temperature for refinement
              systemPrompt: this.getPhaseSystemPrompt('refinement', index),
            }).catch((error) => {
              console.error(`Error in refinement API call for ${modelId}:`, error);
              this.streamHandlers.setStreamingMessageIds((prev) =>
                prev.filter((id) => id !== assistantMessageId)
              );
            });
          }, 500 + (100 * index)); // Delay to ensure previous phase completed

          return assistantMessageId;
        });
    });

    // Wait for all refinement responses to complete
    const refinementMessageIds = await Promise.all(refinementPromises);

    // Wait for streaming to complete before proceeding to summary phase
    await this.waitForStreamingComplete();

    // Phase 3: Summary by the first model (or a designated model)
    console.log("COLLABORATIVE REFINEMENT: Starting Phase 3 - Final Summary");
    const summarizerModelId = modelIds[0]; // Use first model as summarizer
    const summaryMessageId = await this.createModelMessage(chatId, summarizerModelId, modelIds.length * 2);
    allMessageIds.push(summaryMessageId);

    // Mark message as streaming
    this.streamHandlers.setStreamingMessageIds((prev) => [...prev, summaryMessageId]);

    // Start API call for summary
    setTimeout(() => {
      this.callLLMApi(chatId, summaryMessageId, summarizerModelId, {
        content: "Please provide a comprehensive summary that synthesizes all the responses and refinements into a final, authoritative answer.",
        temperature: temperature,
        systemPrompt: this.getPhaseSystemPrompt('summary', 0),
      }).catch((error) => {
        console.error(`Error in summary API call for ${summarizerModelId}:`, error);
        this.streamHandlers.setStreamingMessageIds((prev) =>
          prev.filter((id) => id !== summaryMessageId)
        );
      });
    }, 1000); // Delay to ensure previous phase completed

    return allMessageIds;
  }

  // Helper method to wait for all streaming to complete
  private async waitForStreamingComplete(): Promise<void> {
    return new Promise<void>((resolve) => {
      const checkStreaming = () => {
        const streamingIds = this.streamHandlers.getStreamingMessageIds();
        if (streamingIds.length === 0) {
          resolve();
        } else {
          console.log(`Waiting for ${streamingIds.length} streaming responses to complete...`);
          setTimeout(checkStreaming, 1000);
        }
      };

      // Start checking after a short delay
      setTimeout(checkStreaming, 500);
    });
  }
}