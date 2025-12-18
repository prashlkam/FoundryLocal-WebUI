import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, Model } from "../types";

// Initialize Gemini Client
// We assume process.env.API_KEY is available as per strict instructions.
// In a real browser environment, ensure this is bundled or handled via proxy if not local.
const apiKey = process.env.API_KEY || 'MISSING_KEY'; 
const ai = new GoogleGenAI({ apiKey });

export const streamGeminiResponse = async (
  modelId: string,
  history: Message[],
  systemInstruction?: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  
  // Map internal Role to Gemini format if needed, but SDK handles basic roles well.
  // We need to construct the history properly.
  // Gemini SDK 2.0 chats.create usage:
  
  const chatModel = modelId.includes('gemini') ? modelId : 'gemini-2.5-flash';

  const chat = ai.chats.create({
    model: chatModel,
    config: {
      systemInstruction: systemInstruction,
    },
    history: history.slice(0, -1).map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
  });

  const lastMessage = history[history.length - 1];
  
  if (!lastMessage || lastMessage.role !== Role.USER) {
    throw new Error("Last message must be from user");
  }

  // Handle attachments if present in the last message
  // This is a simplified implementation assuming text-only or basic image support for now
  // For full implementation we would parse attachments into `inlineData`.
  
  const result = await chat.sendMessageStream({
    message: lastMessage.content
  });

  return result;
};

export const getGeminiModels = (): Model[] => {
  return [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
    { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Flash Lite', provider: 'gemini' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', provider: 'gemini' },
  ];
};