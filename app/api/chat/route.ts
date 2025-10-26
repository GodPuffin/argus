import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { streamText, convertToModelMessages, stepCountIs, createIdGenerator } from "ai";
import { aiTools } from "@/lib/ai-tools";
import { loadChat, saveChat } from "@/lib/chat-store";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, chatId, model: selectedModel } = await req.json();

  // Initialize MCP client for Elastic Agent Builder
  let mcpClient: Awaited<ReturnType<typeof experimental_createMCPClient>> | undefined;
  let tools = { ...aiTools };

  const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
  const apiKey = process.env.ELASTICSEARCH_API_KEY;

  if (elasticsearchUrl && apiKey) {
    try {
      // Convert Elasticsearch URL to Kibana URL
      const kibanaUrl = elasticsearchUrl
        .replace(".es.", ".kb.")
        .replace(":443", "");

      mcpClient = await experimental_createMCPClient({
        transport: {
          type: "http",
          url: `${kibanaUrl}/api/agent_builder/mcp`,
          headers: {
            Authorization: `ApiKey ${apiKey}`,
          },
        },
      });

      // Get all available tools from the MCP server and merge with AI tools
      const mcpTools = await mcpClient.tools();
      tools = { ...aiTools, ...mcpTools };
      console.log("Connected to Elastic MCP server, tools:", Object.keys(tools));
    } catch (error) {
      console.error("Failed to connect to Elastic MCP server:", error);
      // Continue without MCP tools if connection fails
    }
  }

  // Validate API keys
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GROQ_API_KEY) {
    return new Response(
      "Missing API keys. Please configure ANTHROPIC_API_KEY or GROQ_API_KEY.",
      { status: 500 }
    );
  }

  // Select the appropriate model and provider
  let model;
  switch (selectedModel) {
    case "claude-sonnet-4.5":
      if (!process.env.ANTHROPIC_API_KEY) {
        return new Response("ANTHROPIC_API_KEY not configured", {
          status: 500,
        });
      }
      model = anthropic("claude-sonnet-4-20250929");
      break;

    case "claude-haiku-4.5":
      if (!process.env.ANTHROPIC_API_KEY) {
        return new Response("ANTHROPIC_API_KEY not configured", {
          status: 500,
        });
      }
      model = anthropic("claude-haiku-4-5-20251001");
      break;

    case "kimi-k2":
      if (!process.env.GROQ_API_KEY) {
        return new Response("GROQ_API_KEY not configured", { status: 500 });
      }
      model = groq("kimi-k2");
      break;

    default:
      // Default to Claude Haiku if no model specified
      if (process.env.ANTHROPIC_API_KEY) {
        model = anthropic("claude-haiku-4-5-20251001");
      } else if (process.env.GROQ_API_KEY) {
        model = groq("kimi-k2");
      } else {
        return new Response("No API keys configured", { status: 500 });
      }
  }

  // Convert UIMessages to ModelMessages
  const modelMessages = convertToModelMessages(messages);
  
  const result = streamText({
    model,
    messages: modelMessages,
    tools,
    providerOptions: {
      anthropic: {
        thinking: {
          type: "enabled",
          budgetTokens: 10000,
        },
      },
    },
    system: elasticsearchUrl && apiKey
      ? "You are a helpful AI assistant with access to a video content database through Elastic Agent Builder. When users ask about videos, streams, or recorded content, use the available search tools to find relevant information. When you mention specific events from search results, use the displayEvent or displayEventById tools to show them as interactive cards that users can click to watch the video at that moment. Provide clear, concise responses based on the search results."
      : "You are a helpful AI assistant for a video streaming platform. You can help users with questions about their video content, streams, and recordings. When discussing specific events, use the displayEvent or displayEventById tools to show them as interactive cards.",
    stopWhen: stepCountIs(10),
    onStepFinish: ({ finishReason }) => {
      console.log("Step finished:", finishReason);
    },
    onError: (error) => {
      console.error("Streaming error:", error);
    },
  });

  // Consume stream to ensure completion even if client disconnects
  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({
      prefix: "msg",
      size: 16,
    }),
    onFinish: async ({ messages: finishedMessages }) => {
      await saveChat({ chatId, messages: finishedMessages });
    },
  });
}

