import { Model, Message, Role } from "../types";

export const checkOllamaConnection = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url.replace(/\/$/, '') + '/api/tags');
    return response.ok;
  } catch (e) {
    return false;
  }
};

export const getOllamaModels = async (baseUrl: string): Promise<Model[]> => {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch Ollama models');
    const data = await response.json();
    return data.models.map((m: any) => ({
      id: m.name,
      name: m.name,
      provider: 'ollama' as const,
      description: `Ollama Model - ${m.details.parameter_size || 'Unknown size'}`,
      contextWindow: 4096 // Default estimate
    }));
  } catch (error) {
    console.error("Ollama: Failed to fetch models:", error);
    return [];
  }
};

export const streamOllamaChat = async (
  baseUrl: string,
  messages: Message[],
  modelId: string,
  systemPrompt: string,
  onChunk: (text: string) => void,
  onComplete: () => void
): Promise<() => void> => {
  const controller = new AbortController();

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === Role.MODEL ? 'assistant' : m.role,
      content: m.content
    }))
  ];

  (async () => {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: formattedMessages,
          stream: true
        }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
      if (!response.body) throw new Error('No response body from Ollama');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              onChunk(json.message.content);
            }
            if (json.done) {
              onComplete();
              return;
            }
          } catch (e) {
            console.warn('Failed to parse Ollama chunk:', line);
          }
        }
      }
      onComplete();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Ollama: Stream Error:", error);
        onChunk(`\n\n[Ollama Error: ${error.message}]`);
        onComplete();
      }
    }
  })();

  return () => controller.abort();
};