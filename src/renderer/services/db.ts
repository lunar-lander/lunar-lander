// Cross-platform database service using localStorage (desktop) or Capacitor Preferences (mobile)
// This provides a unified interface for data persistence across platforms

import { Chat, ChatMessage } from '../../shared/types/chat';
import { Model } from '../../shared/types/model';
import { Preferences } from '@capacitor/preferences';

// Prefix for storage keys
const STORAGE_PREFIX = 'chatapp_';

// Platform detection
const isCapacitor = () => {
  return !!(window as any).Capacitor;
};

// Storage abstraction layer
class Storage {
  static async getItem(key: string): Promise<string | null> {
    if (isCapacitor()) {
      try {
        const { value } = await Preferences.get({ key });
        return value;
      } catch (error) {
        console.error('Capacitor storage error:', error);
        return null;
      }
    } else {
      return localStorage.getItem(key);
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    if (isCapacitor()) {
      try {
        await Preferences.set({ key, value });
      } catch (error) {
        console.error('Capacitor storage error:', error);
      }
    } else {
      localStorage.setItem(key, value);
    }
  }

  static async removeItem(key: string): Promise<void> {
    if (isCapacitor()) {
      try {
        await Preferences.remove({ key });
      } catch (error) {
        console.error('Capacitor storage error:', error);
      }
    } else {
      localStorage.removeItem(key);
    }
  }
}

// DB Service
export class DbService {
  // Chat methods
  static async getChats(): Promise<Chat[]> {
    const chatsJson = await Storage.getItem(`${STORAGE_PREFIX}chats`);
    return chatsJson ? JSON.parse(chatsJson) : [];
  }

  static async saveChats(chats: Chat[]): Promise<void> {
    await Storage.setItem(`${STORAGE_PREFIX}chats`, JSON.stringify(chats));
  }

  static async getChat(chatId: string): Promise<Chat | null> {
    const chats = await this.getChats();
    return chats.find(chat => chat.id === chatId) || null;
  }

  static async saveChat(chat: Chat): Promise<boolean> {
    try {
      if (!chat || !chat.id) {
        console.error('DB: Cannot save chat with invalid ID');
        return false;
      }

      // Get current chats
      const chats = await this.getChats();
      const index = chats.findIndex(c => c.id === chat.id);

      // Ensure chat has a lastUpdated timestamp
      const updatedChat = {
        ...chat,
        lastUpdated: Date.now()
      };

      // Update or add the chat
      if (index !== -1) {
        chats[index] = updatedChat;
      } else {
        chats.unshift(updatedChat);
      }

      // Save updated chats list
      await this.saveChats(chats);

      // Verify chat was saved
      const savedChats = await this.getChats();
      const chatExists = savedChats.some(c => c.id === chat.id);

      if (!chatExists) {
        console.error(`DB: Failed to save chat ${chat.id}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('DB: Error saving chat:', error);
      return false;
    }
  }

  static async deleteChat(chatId: string): Promise<void> {
    const chats = await this.getChats();
    await this.saveChats(chats.filter(chat => chat.id !== chatId));
  }

  static async addMessageToChat(chatId: string, message: ChatMessage): Promise<Chat | null> {
    try {
      // First get the most current version of the chat
      const chat = await this.getChat(chatId);
      if (!chat) {
        console.error(`DB: Chat ${chatId} not found when adding message ${message.id}`);
        return null;
      }

      // Ensure message is not already in the chat (prevent duplicates)
      if (chat.messages.some(m => m.id === message.id)) {
        console.warn(`DB: Message ${message.id} already exists in chat ${chatId}, not adding duplicate`);
        return chat;
      }

      // Create updated chat object
      const updatedChat = {
        ...chat,
        messages: [...chat.messages, message],
        lastUpdated: Date.now()
      };

      // Save the updated chat
      await this.saveChat(updatedChat);

      // Verify message was saved
      const verifyChat = await this.getChat(chatId);
      const messageExists = verifyChat?.messages.some(m => m.id === message.id);

      if (!messageExists) {
        console.error(`DB: Failed to save message ${message.id} to chat ${chatId}`);
      } else {
        // console.log(`DB: Successfully saved message ${message.id} to chat ${chatId}`);
      }

      return updatedChat;
    } catch (error) {
      console.error(`DB: Error adding message to chat ${chatId}:`, error);
      return null;
    }
  }

  // Model methods
  static async getModels(): Promise<Model[]> {
    const modelsJson = await Storage.getItem(`${STORAGE_PREFIX}models`);
    return modelsJson ? JSON.parse(modelsJson) : [];
  }

  static async saveModels(models: Model[]): Promise<void> {
    await Storage.setItem(`${STORAGE_PREFIX}models`, JSON.stringify(models));
  }

  static async getModel(modelId: string): Promise<Model | null> {
    const models = await this.getModels();
    return models.find(model => model.id === modelId) || null;
  }

  static async saveModel(model: Model): Promise<void> {
    const models = await this.getModels();
    const index = models.findIndex(m => m.id === model.id);

    if (index !== -1) {
      models[index] = model;
    } else {
      models.push(model);
    }

    await this.saveModels(models);
  }

  static async addModel(model: Omit<Model, 'id'>): Promise<Model> {
    const newModel: Model = {
      id: `model_${Date.now()}`,
      ...model
    };

    await this.saveModel(newModel);
    return newModel;
  }

  static async updateModel(model: Partial<Model> & { id: string }): Promise<Model | null> {
    const existingModel = await this.getModel(model.id);

    if (!existingModel) {
      return null;
    }

    const updatedModel: Model = {
      ...existingModel,
      ...model
    };

    await this.saveModel(updatedModel);
    return updatedModel;
  }

  static async deleteModel(modelId: string): Promise<void> {
    const models = await this.getModels();
    await this.saveModels(models.filter(model => model.id !== modelId));
  }

  // Generate a chat summary using the first message exchange
  static async generateChatSummary(chatId: string): Promise<string> {
    const chat = await this.getChat(chatId);
    if (!chat || chat.messages.length < 2) return 'New conversation';

    // Get the first user message
    const firstUserMessage = chat.messages[0];
    if (firstUserMessage.sender !== 'user') return 'New conversation';

    // Truncate and return as summary
    const maxLength = 60;
    let summary = firstUserMessage.content;

    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...';
    }

    return summary;
  }
}