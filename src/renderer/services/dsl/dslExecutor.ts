import { DSLConversation, DSLPhase, DSLExecutionContext } from '../../../shared/types/dsl';
import { ChatMessage } from '../../../shared/types/chat';
import { BaseChatHandler } from '../chatLogic/handlers/baseHandler';
import { ChatHandlerDeps, StreamingStateHandlers } from '../chatLogic/chatHandler';

export class DSLExecutor extends BaseChatHandler {
  private dsl: DSLConversation;
  private context: DSLExecutionContext;

  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string,
    dsl: DSLConversation
  ) {
    super(deps, streamHandlers, systemPrompt);
    this.dsl = dsl;
    this.context = {
      currentPhase: 0,
      completedPhases: [],
      phaseResults: {}
    };
  }

  public filterMessages(chatId: string, messageId: string, modelId: string): ChatMessage[] {
    const currentChat = this.deps.getChat(chatId);
    if (!currentChat) return [];

    const currentPhase = this.dsl.phases[this.context.currentPhase];
    if (!currentPhase) return [];

    // Filter out the current message being processed
    const chatMessages = currentChat.messages.filter(
      (msg) => msg.id !== messageId
    );

    let filteredMessages: ChatMessage[] = [];

    switch (currentPhase.context) {
      case 'user_only':
        // Only show user messages, no assistant responses
        filteredMessages = chatMessages.filter(msg => msg.sender === 'user');
        break;

      case 'all_previous':
        // Show all messages from all previous phases
        filteredMessages = chatMessages;
        break;

      case 'phase_previous':
        // Show messages only from the immediately previous phase
        const prevPhaseResults = this.context.currentPhase > 0 
          ? this.context.phaseResults[this.dsl.phases[this.context.currentPhase - 1].name] || []
          : [];
        
        filteredMessages = chatMessages.filter(msg => 
          msg.sender === 'user' || prevPhaseResults.includes(msg.id)
        );
        break;

      default:
        filteredMessages = chatMessages;
    }

    // Sort by timestamp
    const sortedMessages = [...filteredMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    // Add model attribution for better context
    const enhancedMessages = sortedMessages.map(msg => {
      if (msg.sender === "assistant" && msg.modelId) {
        const model = this.deps.models.find(m => m.id === msg.modelId);
        const modelName = model ? model.name : `Model ${msg.modelId}`;
        
        // Check for role assignment
        const modelIndex = this.deps.models.findIndex(m => m.id === msg.modelId);
        const role = this.getModelRole(modelIndex);
        
        const attribution = role ? `[${modelName} as ${role}]` : `[${modelName}]`;
        
        // Only add attribution if it's not already there
        if (!msg.content.startsWith(`[${modelName}`)) {
          return {
            ...msg,
            content: `${attribution}: ${msg.content}`
          };
        }
      }
      return msg;
    });

    console.log(
      `DSL "${this.dsl.name}" Phase ${this.context.currentPhase + 1} (${currentPhase.name}): Model ${modelId} will see ${enhancedMessages.length} messages`
    );

    return enhancedMessages;
  }

  public async handleSendMessage(
    chatId: string,
    content: string,
    temperature: number,
    modelIds: string[]
  ): Promise<string[]> {
    if (!this.dsl.phases || this.dsl.phases.length === 0) {
      throw new Error('No phases defined in DSL');
    }

    const allMessageIds: string[] = [];
    this.context.currentPhase = 0;
    this.context.completedPhases = [];
    this.context.phaseResults = {};

    // Execute each phase
    for (let phaseIndex = 0; phaseIndex < this.dsl.phases.length; phaseIndex++) {
      this.context.currentPhase = phaseIndex;
      const phase = this.dsl.phases[phaseIndex];
      
      console.log(`DSL Executor: Starting Phase ${phaseIndex + 1} - ${phase.name}`);
      
      const phaseMessageIds = await this.executePhase(
        chatId, 
        phase, 
        content, 
        temperature, 
        modelIds,
        phaseIndex
      );
      
      allMessageIds.push(...phaseMessageIds);
      this.context.phaseResults[phase.name] = phaseMessageIds;
      this.context.completedPhases.push(phase.name);

      // Wait for completion if specified
      if (phase.wait_for_completion !== false && phaseIndex < this.dsl.phases.length - 1) {
        await this.waitForStreamingComplete();
      }
    }

    return allMessageIds;
  }

  private async executePhase(
    chatId: string,
    phase: DSLPhase,
    userContent: string,
    temperature: number,
    allModelIds: string[],
    phaseIndex: number
  ): Promise<string[]> {
    const selectedModelIds = this.selectModelsForPhase(phase, allModelIds);
    const phaseMessageIds: string[] = [];

    console.log(`Phase ${phase.name}: Selected models: ${selectedModelIds.join(', ')}`);

    // Create and send messages for selected models
    const promises = selectedModelIds.map(async (modelId, index) => {
      const assistantMessageId = await this.createModelMessage(
        chatId, 
        modelId, 
        phaseIndex * 1000 + index
      );
      
      phaseMessageIds.push(assistantMessageId);
      
      // Mark message as streaming
      this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);
      
      // Prepare the content for this phase
      const phaseContent = phase.prompt || userContent;
      const phaseTemperature = phase.temperature ?? temperature;
      const phaseSystemPrompt = this.buildPhaseSystemPrompt(phase, phaseIndex);
      
      // Start API call with slight delay to prevent rate limiting
      setTimeout(() => {
        this.callLLMApi(chatId, assistantMessageId, modelId, {
          content: phaseContent,
          temperature: phaseTemperature,
          systemPrompt: phaseSystemPrompt,
        }).catch((error) => {
          console.error(`Error in Phase ${phase.name} API call for ${modelId}:`, error);
          this.streamHandlers.setStreamingMessageIds((prev) => 
            prev.filter(id => id !== assistantMessageId)
          );
        });
      }, 100 * index);
      
      return assistantMessageId;
    });

    await Promise.all(promises);
    return phaseMessageIds;
  }

  private selectModelsForPhase(phase: DSLPhase, allModelIds: string[]): string[] {
    const spec = phase.models.toLowerCase().trim();
    
    switch (spec) {
      case 'all':
        return allModelIds;
      case 'first':
        return allModelIds.length > 0 ? [allModelIds[0]] : [];
      case 'last':
        return allModelIds.length > 0 ? [allModelIds[allModelIds.length - 1]] : [];
      case 'random':
        return allModelIds.length > 0 
          ? [allModelIds[Math.floor(Math.random() * allModelIds.length)]] 
          : [];
      default:
        // Handle comma-separated indices like "1,3,5"
        if (/^\d+(,\d+)*$/.test(spec)) {
          const indices = spec.split(',').map(i => parseInt(i.trim()) - 1); // Convert to 0-based
          return indices
            .filter(i => i >= 0 && i < allModelIds.length)
            .map(i => allModelIds[i]);
        }
        
        console.warn(`Unknown model specification: ${spec}, defaulting to all models`);
        return allModelIds;
    }
  }

  private buildPhaseSystemPrompt(phase: DSLPhase, phaseIndex: number): string {
    let prompt = this.systemPrompt;
    
    // Add global DSL prompt if specified
    if (this.dsl.global_prompt) {
      prompt += `\n\n${this.dsl.global_prompt}`;
    }
    
    // Add phase-specific information
    prompt += `\n\n--- DSL Conversation Mode: "${this.dsl.name}" ---`;
    prompt += `\nPhase ${phaseIndex + 1}: ${phase.name}`;
    
    if (this.dsl.description) {
      prompt += `\nConversation Description: ${this.dsl.description}`;
    }
    
    // Add role information if assigned
    const modelIndex = this.deps.models.findIndex(m => 
      this.deps.models.some((model, i) => i === phaseIndex % this.deps.models.length)
    );
    const role = this.getModelRole(modelIndex);
    if (role) {
      prompt += `\nYour Role: ${role}`;
    }
    
    return prompt;
  }

  private getModelRole(modelIndex: number): string | undefined {
    if (modelIndex < 0) return undefined;
    
    // Check global roles first
    if (this.dsl.global_roles && this.dsl.global_roles[modelIndex.toString()]) {
      return this.dsl.global_roles[modelIndex.toString()];
    }
    
    // Check current phase roles
    const currentPhase = this.dsl.phases[this.context.currentPhase];
    if (currentPhase?.roles && currentPhase.roles[modelIndex.toString()]) {
      return currentPhase.roles[modelIndex.toString()];
    }
    
    return undefined;
  }

  private async waitForStreamingComplete(): Promise<void> {
    return new Promise<void>((resolve) => {
      const checkStreaming = () => {
        const streamingIds = this.streamHandlers.getStreamingMessageIds();
        if (streamingIds.length === 0) {
          resolve();
        } else {
          setTimeout(checkStreaming, 1000);
        }
      };
      
      // Start checking after a short delay
      setTimeout(checkStreaming, 500);
    });
  }
}