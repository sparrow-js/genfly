import type { Message } from 'ai';

export interface IChatMetadata {
  gitUrl: string;
  gitBranch?: string;
}

export interface ChatHistoryItem {
  id: string;
  messages: Message[];
  urlId?: string;
  description?: string;
  timestamp?: string;
  metadata?: IChatMetadata;
} 