import { ChatMessage } from "../../../../shared/types/chat";
import { ChatHandlerDeps, StreamingStateHandlers } from "../chatHandler";

// Base abstract class for all chat handlers
export abstract class BaseChatHandler {
  protected deps: ChatHandlerDeps;
  protected streamHandlers: StreamingStateHandlers;
  protected systemPrompt: string;
  
  constructor(
    deps: ChatHandlerDeps,
    streamHandlers: StreamingStateHandlers,
    systemPrompt: string,
  ) {
    this.deps = deps;
    this.streamHandlers = streamHandlers;
    this.systemPrompt = systemPrompt;
  }
  
  // Abstract methods that must be implemented by specific handlers
  abstract handleSendMessage(
    chatId: string,
    content: string,
    modelIds: string[],
    temperature: number
  ): Promise<string[]>;
  
  // Filter messages based on the conversation mode
  abstract filterMessages(chatId: string, messageId: string, modelId: string): ChatMessage[];
  
  // Call LLM API and handle streaming response - shared by all handlers
  public async callLLMApi(
    chatId: string,
    messageId: string,
    modelId: string,
    request: {
      content: string;
      temperature: number;
      systemPrompt: string;
    }
  ) {
    try {
      // Find the model configuration
      const model = this.deps.models.find((m) => m.id === modelId);
      if (!model) {
        throw new Error(`Model with ID ${modelId} not found`);
      }

      // Get the current chat to determine context
      const currentChat = this.deps.getChat(chatId);
      if (!currentChat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }

      // Prepare messages for the API call based on conversation mode
      let apiMessages = [];

      // Always include the system prompt as the first message
      if (request.systemPrompt) {
        apiMessages.push({
          role: "system",
          content: request.systemPrompt,
        });
      }
      
      // Get filtered messages based on the conversation mode
      const filteredMessages = this.filterMessages(chatId, messageId, modelId);

      // Convert filtered messages to API format
      let userMessagesAdded = 0;
      let assistantMessagesAdded = 0;

      filteredMessages.forEach((msg) => {
        if (msg.sender === "user") {
          apiMessages.push({
            role: "user",
            content: msg.content,
          });
          userMessagesAdded++;
        } else if (msg.sender === "assistant" && msg.modelId) {
          apiMessages.push({
            role: "assistant",
            content: msg.content, // Content may already be attributed by specific handlers
          });
          assistantMessagesAdded++;
        }
      });

      // CRITICAL SAFEGUARD: If no user messages were added, add the request content
      // as a user message to ensure the API call doesn't fail
      if (userMessagesAdded === 0) {
        console.warn(
          `CRITICAL: No user messages in API call. Adding current message as fallback.`
        );
        apiMessages.push({
          role: "user",
          content: request.content,
        });
        userMessagesAdded++;
      }

      // Log the number of messages added to the API by role
      console.log(`API message construction for ${model.name}:`);
      console.log(`- System messages: ${request.systemPrompt ? 1 : 0}`);
      console.log(`- User messages: ${userMessagesAdded}`);
      console.log(`- Assistant messages: ${assistantMessagesAdded}`);

      // Still warn if we had to use the fallback mechanism
      if (userMessagesAdded === 1 && filteredMessages.length === 0) {
        console.warn(
          `WARNING: Using fallback user message for API call to ${model.name}`
        );
      }

      console.log(
        `Making API call to ${model.baseUrl} for model ${model.modelName}`
      );

      // Make the API call with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      try {
        response = await fetch(`${model.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${model.apiKey}`,
          },
          body: JSON.stringify({
            model: model.modelName,
            messages: apiMessages,
            temperature: request.temperature,
            stream: true, // Enable streaming
          }),
          signal: controller.signal,
        });

        // Clear the timeout since the request completed
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`API error for model ${model.name}:`, errorData);
          throw new Error(
            `API returned status ${response.status}: ${
              errorData || "Unknown error"
            }`
          );
        }

        console.log(`API call successful for model ${model.name}`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          console.error(
            `API call to ${model.baseUrl} timed out after 30 seconds`
          );
          throw new Error(
            `Request to ${model.name} timed out. Please try again.`
          );
        }
        throw fetchError;
      }

      // Make sure we have a valid response object before proceeding
      if (!response) {
        throw new Error("No response received from API");
      }

      // Process the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let content = "";
      const decoder = new TextDecoder();

      // Read stream chunks - returns a promise so we can catch errors outside
      const readStream = async (): Promise<void> => {
        try {
          const { done, value } = await reader.read();

          if (done) {
            // End of stream, remove from streaming list
            this.streamHandlers.setStreamingMessageIds((prev) =>
              prev.filter((id) => id !== messageId)
            );
            return;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });

          // Process the chunk to extract the content
          const lines = chunk
            .toString()
            .split("\n")
            .filter((line) => line.trim() !== "");

          for (const line of lines) {
            try {
              // Handle SSE format properly
              if (!line.startsWith("data:")) continue;

              const message = line.replace(/^data: /, "").trim();

              // Skip [DONE] messages
              if (message === "[DONE]") continue;

              // Skip empty messages
              if (!message) continue;

              try {
                const parsed = JSON.parse(message);

                // Extract content from delta - handle case where choices might be undefined
                if (parsed.choices && parsed.choices.length > 0) {
                  const delta = parsed.choices[0]?.delta?.content || "";
                  if (delta) {
                    content += delta;

                    // Update message content in the chat
                    try {
                      const chatData = this.deps.getChat(chatId);
                      if (!chatData) {
                        console.error(`Chat data not found for ID: ${chatId}`);
                        return;
                      }

                      // Find the message to make sure it exists
                      const messageToUpdate = chatData.messages.find(
                        (msg) => msg.id === messageId
                      );
                      if (!messageToUpdate) {
                        console.error(
                          `Message ${messageId} not found in chat ${chatId}`
                        );

                        // Recreate the missing message and add it to the chat
                        console.log(
                          `Attempting to recreate missing message ${messageId}`
                        );

                        // Extract model ID from messageId (format is msg_timestamp_modelId)
                        const recreatedModelId =
                          messageId.split("_").pop() || "";

                        const recreatedMessage: ChatMessage = {
                          id: messageId,
                          sender: "assistant",
                          content: content,
                          timestamp: Date.now(),
                          modelId: recreatedModelId,
                        };

                        // Add recreated message to chat
                        this.deps.addMessageToChat(chatId, recreatedMessage);

                        // Get updated chat data
                        const refreshedChat = this.deps.getChat(chatId);
                        if (!refreshedChat) {
                          console.error(
                            `Still can't retrieve chat ${chatId} after message recreation`
                          );
                          return;
                        }

                        // Check if message was successfully recreated
                        if (
                          !refreshedChat.messages.some(
                            (msg) => msg.id === messageId
                          )
                        ) {
                          console.error(
                            `Failed to recreate message ${messageId}`
                          );
                          return;
                        }

                        return;
                      }

                      const updatedMessages = chatData.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, content } : msg
                      );

                      const updatedChat = {
                        ...chatData,
                        messages: updatedMessages,
                      };

                      // Then update database
                      this.deps.updateChat(updatedChat);

                      console.log(
                        `Updated message ${messageId}, new content length: ${content.length}`
                      );
                    } catch (updateError) {
                      console.error(
                        `Error updating message content:`,
                        updateError
                      );
                    }
                  }
                }
              } catch (parseError) {
                // Silently ignore parse errors for individual messages
                // This happens frequently with partial chunks in streaming
              }
            } catch (e) {
              // Only log severe errors, not parsing issues
              if (e instanceof SyntaxError === false) {
                console.warn("Error processing message:", e);
              }
            }
          }

          // Continue reading
          readStream();
        } catch (error) {
          console.error("Error reading stream:", error);

          try {
            // Make sure we preserve the message even when the stream errors out
            const chatData = this.deps.getChat(chatId);
            if (chatData) {
              // Find the message to make sure it exists
              const messageToUpdate = chatData.messages.find(
                (msg) => msg.id === messageId
              );

              if (messageToUpdate) {
                // Update with error indication but preserve any content we have
                const errorMessage = `${content}\n\n[Error: Connection interrupted]`;

                const updatedMessages = chatData.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, content: errorMessage } : msg
                );

                const updatedChat = { ...chatData, messages: updatedMessages };

                // Then update database
                this.deps.updateChat(updatedChat);
                console.log(
                  `Preserved message ${messageId} after stream error`
                );
              }
            }
          } catch (preserveError) {
            console.error(
              "Error preserving message after stream error:",
              preserveError
            );
          }

          // Finally, mark as no longer streaming
          this.streamHandlers.setStreamingMessageIds((prev) =>
            prev.filter((id) => id !== messageId)
          );
        }
      };

      // Start reading the stream with additional error handling
      readStream().catch((error) => {
        console.error(`Unhandled error in readStream for ${modelId}:`, error);

        try {
          // Ensure the message is preserved with error information
          const chatData = this.deps.getChat(chatId);
          if (chatData) {
            const messageToUpdate = chatData.messages.find(
              (msg) => msg.id === messageId
            );
            if (messageToUpdate) {
              // Include any existing content plus error message
              const errorContent = messageToUpdate.content
                ? `${messageToUpdate.content}\n\n[Error: ${
                    error.message || "Unknown error"
                  }]`
                : `[Error: ${error.message || "Unknown error"}]`;

              const updatedMessages = chatData.messages.map((msg) =>
                msg.id === messageId ? { ...msg, content: errorContent } : msg
              );

              const updatedChat = { ...chatData, messages: updatedMessages };
              this.deps.updateChat(updatedChat);
            }
          }
        } catch (cleanupError) {
          console.error("Error during error cleanup:", cleanupError);
        }

        // Mark message as no longer streaming
        this.streamHandlers.setStreamingMessageIds((prev) => prev.filter((id) => id !== messageId));
      });
    } catch (error: any) {
      console.error("Error calling LLM API:", error);

      // Update the message with the error
      const chatData = this.deps.getChat(chatId);
      if (chatData) {
        const errorMessage = `Error: Failed to get response from the model. ${error.message}`;

        const updatedMessages = chatData.messages.map((msg) =>
          msg.id === messageId ? { ...msg, content: errorMessage } : msg
        );

        const updatedChat = { ...chatData, messages: updatedMessages };
        this.deps.updateChat(updatedChat);
      }

      // Remove from streaming list
      this.streamHandlers.setStreamingMessageIds((prev) => prev.filter((id) => id !== messageId));
    }
  }
  
  // Create model-specific message for sending to chat
  protected createModelMessage(
    chatId: string,
    modelId: string,
    index: number
  ): Promise<string> {
    // Generate unique ID with timestamp to avoid collisions
    const timestamp = Date.now() + index;
    const assistantMessageId = `msg_${timestamp}_${modelId}`;

    // Create initial placeholder message
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      sender: "assistant",
      content: "",
      timestamp: timestamp, // Ensure unique timestamps
      modelId,
    };

    console.log(
      `Creating message ${assistantMessageId} for model ${modelId}`
    );

    // Add message to chat and return a promise wrapper to handle async
    return new Promise<string>((resolve) => {
      // Add message to chat
      this.deps.addMessageToChat(chatId, assistantMessage);

      // Short delay to ensure DB operations complete
      setTimeout(() => {
        // Verify message was added
        const chatData = this.deps.getChat(chatId);
        const messageExists = chatData?.messages.some(
          (m) => m.id === assistantMessageId
        );

        if (!messageExists) {
          console.error(
            `Message ${assistantMessageId} was not properly added to chat ${chatId}`
          );
        }

        resolve(assistantMessageId);
      }, 50 * index); // Stagger slightly to avoid race conditions
    });
  }
}