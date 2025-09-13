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

      let isStreamClosed = false;

      // Cleanup function to ensure proper resource disposal
      const cleanupStream = () => {
        if (!isStreamClosed) {
          isStreamClosed = true;
          try {
            reader.cancel();
          } catch (cancelError) {
            console.warn("Error canceling stream reader:", cancelError);
          }
        }
      };

      let content = "";
      const decoder = new TextDecoder();
      let lastUpdateTime = 0;
      let lastDbUpdateTime = 0;
      const UPDATE_THROTTLE_MS = 200; // Update UI less frequently for better performance
      const DB_THROTTLE_MS = 500; // Update database even less frequently
      let pendingContent = ""; // Buffer content between updates

      // Read stream chunks - returns a promise so we can catch errors outside
      const readStream = async (): Promise<void> => {
        try {
          const { done, value } = await reader.read();

          if (done) {
            // End of stream - ensure final content update with optimized approach
            if (content) {
              try {
                const chatData = this.deps.getChat(chatId);
                if (chatData) {
                  const messageIndex = chatData.messages.findIndex(
                    (msg) => msg.id === messageId
                  );
                  if (messageIndex !== -1) {
                    // Direct in-place update to avoid memory allocation
                    chatData.messages[messageIndex].content = content;
                    this.deps.updateChat(chatData);
                  }
                }
              } catch (finalUpdateError) {
                console.error("Error in final content update:", finalUpdateError);
              }
            }

            // Remove from streaming list
            this.streamHandlers.setStreamingMessageIds((prev) =>
              prev.filter((id) => id !== messageId)
            );

            // Clean up stream resources
            cleanupStream();
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
                    pendingContent += delta;

                    // Throttle UI updates to prevent excessive memory allocation
                    const currentTime = Date.now();
                    const shouldUpdateUi = currentTime - lastUpdateTime >= UPDATE_THROTTLE_MS || pendingContent.length >= 1000;
                    const shouldUpdateDb = currentTime - lastDbUpdateTime >= DB_THROTTLE_MS || pendingContent.length >= 2000;

                    if (!shouldUpdateUi && !shouldUpdateDb) {
                      continue; // Skip this update to throttle rendering and DB writes
                    }

                    // Only update when we have significant content or enough time has passed
                    if (shouldUpdateUi) lastUpdateTime = currentTime;
                    if (shouldUpdateDb) lastDbUpdateTime = currentTime;

                    const contentToUpdate = content;
                    pendingContent = ""; // Reset pending buffer

                    // OPTIMIZED: Direct message update without full chat reconstruction
                    try {
                      const chatData = this.deps.getChat(chatId);
                      if (!chatData) {
                        console.error(`Chat data not found for ID: ${chatId}`);
                        continue; // Continue processing instead of returning
                      }

                      // Find message index for direct update
                      const messageIndex = chatData.messages.findIndex(
                        (msg) => msg.id === messageId
                      );

                      if (messageIndex === -1) {
                        // Message doesn't exist - create it once and continue
                        const recreatedModelId = messageId.split("_").pop() || "";
                        const recreatedMessage: ChatMessage = {
                          id: messageId,
                          sender: "assistant",
                          content: contentToUpdate,
                          timestamp: Date.now(),
                          modelId: recreatedModelId,
                        };
                        this.deps.addMessageToChat(chatId, recreatedMessage);
                        continue;
                      }

                      // CRITICAL FIX: Update message in-place instead of creating new arrays
                      chatData.messages[messageIndex].content = contentToUpdate;

                      // Only update database when throttling allows it
                      if (shouldUpdateDb) {
                        this.deps.updateChat(chatData);
                      }
                    } catch (updateError) {
                      console.error(`Error updating message content:`, updateError);
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

          // Continue reading with throttling to prevent CPU overload
          requestAnimationFrame(readStream);
        } catch (error) {
          console.error("Error reading stream:", error);

          // Clean up resources on error
          cleanupStream();

          try {
            // Make sure we preserve the message even when the stream errors out
            const chatData = this.deps.getChat(chatId);
            if (chatData) {
              const messageIndex = chatData.messages.findIndex(
                (msg) => msg.id === messageId
              );

              if (messageIndex !== -1) {
                // Update with error indication but preserve any content we have
                const errorMessage = `${content}\n\n[Error: Connection interrupted]`;

                // Direct in-place update to avoid memory allocation
                chatData.messages[messageIndex].content = errorMessage;
                this.deps.updateChat(chatData);
                console.log(`Preserved message ${messageId} after stream error`);
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

        // Ensure cleanup on unhandled errors
        cleanupStream();

        try {
          // Ensure the message is preserved with error information
          const chatData = this.deps.getChat(chatId);
          if (chatData) {
            const messageIndex = chatData.messages.findIndex(
              (msg) => msg.id === messageId
            );
            if (messageIndex !== -1) {
              const currentContent = chatData.messages[messageIndex].content;
              // Include any existing content plus error message
              const errorContent = currentContent
                ? `${currentContent}\n\n[Error: ${error.message || "Unknown error"}]`
                : `[Error: ${error.message || "Unknown error"}]`;

              // Direct in-place update to avoid memory allocation
              chatData.messages[messageIndex].content = errorContent;
              this.deps.updateChat(chatData);
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
        const messageIndex = chatData.messages.findIndex(
          (msg) => msg.id === messageId
        );
        if (messageIndex !== -1) {
          const errorMessage = `Error: Failed to get response from the model. ${error.message}`;
          // Direct in-place update to avoid memory allocation
          chatData.messages[messageIndex].content = errorMessage;
          this.deps.updateChat(chatData);
        }
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