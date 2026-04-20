import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const openRouterProvider = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer":
      process.env.NEXT_PUBLIC_APP_URL ?? "https://argus.demo.local",
    "X-Title": "Argus Demo",
  },
});

export function openrouter(modelId: string) {
  return openRouterProvider.chatModel(modelId);
}

// Cheap / free-tier models that work well with tool calling.
export const OPENROUTER_DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
