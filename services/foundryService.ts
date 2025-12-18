import OpenAI from 'openai';
import { Model, Message, Role } from "../types";
import { FoundryLocalManager } from 'foundry-local-sdk'; 

let foundryManager: FoundryLocalManager | null = null;

/**
 * Checks if a URL is responding to a simple health check (models endpoint).
 */
const isServerHealthy = async (url: string, timeout = 2000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    // Check both /models and /v1/models
    const cleanUrl = url.replace(/\/$/, "");
    const endpoints = [`${cleanUrl}/models`, `${cleanUrl}/v1/models`];
    
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, { 
          method: 'GET', 
          signal: controller.signal,
          headers: { 'Authorization': 'Bearer local' } // Default fallback key
        });
        if (res.ok || res.status === 401) {
          clearTimeout(id);
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    clearTimeout(id);
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Initialize Foundry Local Engine or connect to an existing one.
 */
export const initializeFoundry = async (modelAlias: string = "qwen2.5-coder-0.5b") => {
  // 1. Proactively check if a server is already running on common local ports
  // This bypasses the need for the CLI binary if the user started it another way.
  const commonPorts = ['8000', '11434', '8080'];
  const hosts = ['http://127.0.0.1', 'http://localhost'];
  
  for (const host of hosts) {
    for (const port of commonPorts) {
      const url = `${host}:${port}`;
      if (await isServerHealthy(url, 1000)) {
        console.log(`Foundry: Found existing server at ${url}`);
        return {
          endpoint: url.endsWith('/v1') ? url : `${url}/v1`,
          apiKey: 'local',
          modelInfo: { id: modelAlias, name: modelAlias, provider: 'foundry' }
        };
      }
    }
  }

  // 2. If no server found, attempt to use the SDK to start one
  try {
    console.log("Foundry: No existing server found. Attempting SDK initialization...");
    foundryManager = new FoundryLocalManager();
    
    // Note: In a browser environment, manager.init() will likely fail if it 
    // attempts to execute shell commands via Node.js internals.
    const modelInfo = await foundryManager.init(modelAlias);
    
    return {
      endpoint: foundryManager.endpoint,
      apiKey: foundryManager.apiKey,
      modelInfo: modelInfo
    };
  } catch (error: any) {
    console.warn("Foundry: SDK Initialization failed.", error.message);
    // Rethrow the specific "not installed" error so the UI can prompt the user
    throw error;
  }
};

export const checkConnection = async (baseUrl: string, timeout = 3000): Promise<string | null> => {
  const healthy = await isServerHealthy(baseUrl, timeout);
  if (healthy) {
    return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl.replace(/\/$/, "")}/v1`;
  }
  return null;
};

export const getModels = async (baseUrl: string): Promise<Model[]> => {
  try {
    const authKey = foundryManager?.apiKey || 'local';
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${authKey}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const list = data.data || data;

    if (Array.isArray(list)) {
      return list.map((m: any) => ({
        id: m.id,
        name: m.id, 
        provider: 'foundry',
        description: 'Local LLM',
        contextWindow: m.context_window || 4096 
      }));
    }
    return [];
  } catch (error) {
    console.error("Foundry: Failed to fetch models:", error);
    return [];
  }
};

export const streamChat = async (
  baseUrl: string,
  messages: Message[],
  modelId: string,
  attachments: File[] | undefined,
  systemPrompt: string,
  onChunk: (text: string) => void,
  onComplete: () => void
): Promise<() => void> => {
  const controller = new AbortController();
  const authKey = foundryManager?.apiKey || 'local';
  
  const client = new OpenAI({
    baseURL: baseUrl,
    apiKey: authKey,
    dangerouslyAllowBrowser: true 
  });

  const openAIMessages: any[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === Role.MODEL ? 'assistant' : m.role,
      content: m.content
    }))
  ];

  (async () => {
    try {
      const stream = await client.chat.completions.create({
        model: modelId,
        messages: openAIMessages,
        stream: true,
      }, { signal: controller.signal });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) onChunk(content);
      }
      onComplete();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Foundry: Stream Error:", error);
        onChunk(`\n\n[Error: ${error.message}]`);
        onComplete();
      }
    }
  })();

  return () => controller.abort();
};