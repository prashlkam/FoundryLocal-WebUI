export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isThinking?: boolean;
}

export interface Attachment {
  name: string;
  type: 'image' | 'file' | 'link';
  url?: string;
  data?: string; // base64
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  modelId: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  avatar?: string;
  email?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: 'foundry' | 'gemini' | 'ollama';
  description?: string;
  contextWindow?: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  foundryUrl: string; 
  ollamaUrl: string;
  systemPrompt: string;
  defaultModel: string;
  enableWebSearch: boolean;
  useGeminiDirect: boolean; 
  activeProvider: 'foundry' | 'ollama' | 'gemini';
}