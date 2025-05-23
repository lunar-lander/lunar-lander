// Shared type definitions for chat-related entities

export interface Chat {
  id: string;
  summary: string;
  date: string;
  messages: ChatMessage[];
  lastUpdated: number;
  isStarred?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelId?: string; // For assistant messages, which model sent it
}

export interface ChatSummaryRequest {
  chatId: string;
  messages: ChatMessage[];
  modelId: string;
}