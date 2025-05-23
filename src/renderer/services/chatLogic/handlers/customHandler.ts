import { ChatMessage } from "../../../../shared/types/chat";
import { BaseChatHandler } from "./baseHandler";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";
import { CustomConfig } from "../../../contexts/AppContext";
import { DSLExecutor } from "../../dsl/dslExecutor";
import { DSLParser } from "../../dsl/dslParser";

export class CustomChatHandler extends BaseChatHandler {
  private customConfig: CustomConfig | null;
  private dslExecutor: DSLExecutor | null = null;
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string,
    customConfig: CustomConfig | null,
  ) {
    super(deps, streamHandlers, systemPrompt);
    this.customConfig = customConfig;
    
    // Try to parse custom config as DSL
    if (customConfig?.rules) {
      try {
        const dsl = DSLParser.parse(customConfig.rules);
        this.dslExecutor = new DSLExecutor(deps, streamHandlers, systemPrompt, dsl);
        console.log(`DSL parsed successfully for custom config: ${customConfig.name}`);
      } catch (error) {
        console.warn(`Failed to parse custom config as DSL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.warn('Falling back to basic custom mode behavior');
      }
    }
  }
  
  public filterMessages(chatId: string, messageId: string, modelId: string): ChatMessage[] {
    // If we have a DSL executor, use it
    if (this.dslExecutor) {
      return this.dslExecutor.filterMessages(chatId, messageId, modelId);
    }
    
    // Fallback to basic behavior
    const currentChat = this.deps.getChat(chatId);
    if (!currentChat) return [];
    
    const chatMessages = currentChat.messages.filter(
      (msg) => msg.id !== messageId
    );
    
    const sortedChatMessages = [...chatMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    
    if (this.customConfig) {
      console.log(
        `CUSTOM mode with config "${this.customConfig.name}": Using basic behavior (custom rules not DSL-compatible)`
      );
    } else {
      console.log(`CUSTOM mode: Using basic behavior (no config provided)`);
    }
    
    return sortedChatMessages;
  }
  
  public async handleSendMessage(
    chatId: string,
    content: string,
    temperature: number,
    modelIds: string[]
  ): Promise<string[]> {
    // If we have a DSL executor, use it
    if (this.dslExecutor) {
      return this.dslExecutor.handleSendMessage(chatId, content, temperature, modelIds);
    }
    
    // Fallback to basic behavior (like discuss mode)
    const messagePromises = modelIds.map((modelId, index) => {
      return this.createModelMessage(chatId, modelId, index)
        .then(assistantMessageId => {
          this.streamHandlers.setStreamingMessageIds((prev) => [...prev, assistantMessageId]);
          
          setTimeout(() => {
            this.callLLMApi(chatId, assistantMessageId, modelId, {
              content,
              temperature,
              systemPrompt: this.systemPrompt,
            }).catch((error) => {
              console.error(`Error in API call for ${modelId}:`, error);
              this.streamHandlers.setStreamingMessageIds((prev) =>
                prev.filter((id) => id !== assistantMessageId)
              );
            });
          }, 100);
          
          return assistantMessageId;
        });
    });
    
    return Promise.all(messagePromises);
  }
}