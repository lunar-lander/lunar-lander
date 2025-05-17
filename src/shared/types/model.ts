// Shared type definitions for LLM model configuration

export interface Model {
  id: string;
  name: string;
  baseUrl: string;
  modelName: string;
  apiKey: string;
  isActive: boolean;
}

export interface ModelRequest {
  modelId: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  temperature?: number;
  maxTokens?: number;
}