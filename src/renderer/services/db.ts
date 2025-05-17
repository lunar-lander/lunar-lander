// Simple database service using localStorage
// This can be replaced with SQLite or file-based storage later

import { Chat, ChatMessage } from '../../shared/types/chat';
import { Model } from '../../shared/types/model';

// Prefix for localStorage keys
const STORAGE_PREFIX = 'chatapp_';

// DB Service
export class DbService {
  // Chat methods
  static getChats(): Chat[] {
    const chatsJson = localStorage.getItem(`${STORAGE_PREFIX}chats`);
    return chatsJson ? JSON.parse(chatsJson) : [];
  }

  static saveChats(chats: Chat[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}chats`, JSON.stringify(chats));
  }

  static getChat(chatId: string): Chat | null {
    const chats = this.getChats();
    return chats.find(chat => chat.id === chatId) || null;
  }

  static saveChat(chat: Chat): void {
    const chats = this.getChats();
    const index = chats.findIndex(c => c.id === chat.id);
    
    // Update or add the chat
    if (index !== -1) {
      chats[index] = { ...chat, lastUpdated: Date.now() };
    } else {
      chats.unshift({ ...chat, lastUpdated: Date.now() });
    }
    
    this.saveChats(chats);
  }

  static deleteChat(chatId: string): void {
    const chats = this.getChats();
    this.saveChats(chats.filter(chat => chat.id !== chatId));
  }

  static addMessageToChat(chatId: string, message: ChatMessage): Chat | null {
    const chat = this.getChat(chatId);
    if (!chat) return null;

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, message],
      lastUpdated: Date.now()
    };

    this.saveChat(updatedChat);
    return updatedChat;
  }

  // Model methods
  static getModels(): Model[] {
    const modelsJson = localStorage.getItem(`${STORAGE_PREFIX}models`);
    return modelsJson ? JSON.parse(modelsJson) : [];
  }

  static saveModels(models: Model[]): void {
    localStorage.setItem(`${STORAGE_PREFIX}models`, JSON.stringify(models));
  }

  static getModel(modelId: string): Model | null {
    const models = this.getModels();
    return models.find(model => model.id === modelId) || null;
  }

  static saveModel(model: Model): void {
    const models = this.getModels();
    const index = models.findIndex(m => m.id === model.id);
    
    if (index !== -1) {
      models[index] = model;
    } else {
      models.push(model);
    }
    
    this.saveModels(models);
  }
  
  static addModel(model: Omit<Model, 'id'>): Model {
    const newModel: Model = {
      id: `model_${Date.now()}`,
      ...model
    };
    
    this.saveModel(newModel);
    return newModel;
  }
  
  static updateModel(model: Partial<Model> & { id: string }): Model | null {
    const existingModel = this.getModel(model.id);
    
    if (!existingModel) {
      return null;
    }
    
    const updatedModel: Model = {
      ...existingModel,
      ...model
    };
    
    this.saveModel(updatedModel);
    return updatedModel;
  }

  static deleteModel(modelId: string): void {
    const models = this.getModels();
    this.saveModels(models.filter(model => model.id !== modelId));
  }

  // Generate a chat summary using the first message exchange
  static generateChatSummary(chatId: string): string {
    const chat = this.getChat(chatId);
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