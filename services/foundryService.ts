import OpenAI from 'openai';
import { Model, Message, Role } from "../types";
import { FoundryLocalManager } from 'foundry-local-sdk/browser';

let foundryManager: FoundryLocalManager | null = null;

/**
 * Checks if a URL is responding to a health check on the OpenAI-compatible /v1/models endpoint.
 * Normalizes the URL to always check the correct path regardless of whether /v1 is included.
 */
const isServerHealthy = async (url: string, timeout = 2000): Promise<boolean> => {
  // Normalize: strip trailing slashes and /v1 suffix to get the base service URL
  const baseUrl = url.replace(/\/+$/, "").replace(/\/v1\/?$/, "");
  const endpoint = `${baseUrl}/v1/models`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok || res.status === 401;
  } catch (e) {
    return false;
  }
};

/**
 * Initialize Foundry Local Engine or connect to an existing one.
 * Scans common ports for a running FoundryLocal service and creates
 * a browser-compatible SDK manager.
 */
export const initializeFoundry = async (modelAlias: string = "qwen2.5-coder-0.5b") => {
  // Check common ports for a running FoundryLocal service.
  // Port 5273 is the common FoundryLocal default.
  // We intentionally exclude 11434 (Ollama's default port) to avoid misdetection.
  const commonPorts = ['5273', '8000', '8080'];
  const hosts = ['http://127.0.0.1', 'http://localhost'];

  for (const host of hosts) {
    for (const port of commonPorts) {
      const url = `${host}:${port}`;
      if (await isServerHealthy(url, 1500)) {
        console.log(`Foundry: Found existing service at ${url}`);

        // Create browser-compatible SDK manager with the discovered service URL
        foundryManager = new FoundryLocalManager({ serviceUrl: url });

        return {
          endpoint: foundryManager.endpoint, // returns ${serviceUrl}/v1
          apiKey: foundryManager.apiKey,
          modelInfo: { id: modelAlias, name: modelAlias, provider: 'foundry' as const }
        };
      }
    }
  }

  throw new Error(
    "No FoundryLocal service detected. Please start FoundryLocal first " +
    "(e.g. run `foundry service start` in your terminal), then try again."
  );
};

/**
 * Check if a Foundry-compatible server is reachable at the given URL.
 * Returns the normalized /v1 endpoint URL on success, or null on failure.
 */
export const checkConnection = async (baseUrl: string, timeout = 3000): Promise<string | null> => {
  const healthy = await isServerHealthy(baseUrl, timeout);
  if (healthy) {
    const cleanUrl = baseUrl.replace(/\/+$/, "").replace(/\/v1\/?$/, "");
    return `${cleanUrl}/v1`;
  }
  return null;
};

/**
 * Fetch available models from the Foundry-compatible server.
 */
export const getModels = async (baseUrl: string): Promise<Model[]> => {
  try {
    const cleanUrl = baseUrl.replace(/\/+$/, "");
    const authKey = foundryManager?.apiKey || 'OPENAI_API_KEY';
    const response = await fetch(`${cleanUrl}/models`, {
      headers: { 'Authorization': `Bearer ${authKey}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const list = data.data || data;

    if (Array.isArray(list)) {
      return list.map((m: any) => ({
        id: m.id,
        name: m.id,
        provider: 'foundry' as const,
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

/**
 * Stream a chat completion from the Foundry-compatible server using OpenAI SDK.
 * Returns an abort function to cancel the stream.
 */
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
  const cleanUrl = baseUrl.replace(/\/+$/, "");
  const authKey = foundryManager?.apiKey || 'OPENAI_API_KEY';

  const client = new OpenAI({
    baseURL: cleanUrl,
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
