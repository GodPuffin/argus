import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { lettaCloud } from "@letta-ai/vercel-ai-sdk-provider";
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
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GROQ_API_KEY && !process.env.LETTA_API_KEY) {
    return new Response(
      "Missing API keys. Please configure ANTHROPIC_API_KEY, GROQ_API_KEY, or LETTA_API_KEY.",
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
      model = groq("moonshotai/kimi-k2-instruct-0905");
      break;

    case "stateful-argus":
      if (!process.env.LETTA_API_KEY) {
        return new Response("LETTA_API_KEY not configured", { status: 500 });
      }
      if (!process.env.LETTA_AGENT_ID) {
        return new Response("LETTA_AGENT_ID not configured. Please set the ID of your 'stateful argus' agent.", { status: 500 });
      }
      model = lettaCloud();
      break;

    default:
      // Default to Claude Haiku if no model specified
      if (process.env.ANTHROPIC_API_KEY) {
        model = anthropic("claude-haiku-4-5-20251001");
      } else {
        return new Response("No API keys configured", { status: 500 });
      }
  }

  // Convert UIMessages to ModelMessages
  const modelMessages = convertToModelMessages(messages);
  
  // Configure provider-specific options
  const providerOptions: any = {
    anthropic: {
      thinking: {
        type: "enabled",
        budgetTokens: 10000,
      },
    },
  };

  // Add Letta-specific options when using Letta model
  if (selectedModel === "stateful-argus") {
    providerOptions.letta = {
      agent: {
        id: process.env.LETTA_AGENT_ID,
        maxSteps: 10,
        streamTokens: true,
      },
    };
  }
  
  // Build streamText config
  const streamConfig: any = {
    model,
    messages: modelMessages,
    tools,
    providerOptions,
    stopWhen: stepCountIs(10),
  };

  // Only add system prompt for non-Letta models
  // Letta agents use their own configured system prompt from Letta Cloud
  if (selectedModel !== "stateful-argus") {
    streamConfig.system = elasticsearchUrl && apiKey
      ? "You are a helpful AI assistant named Argus with access to a video content database through Elastic Agent Builder. When users ask about videos, streams, or recorded content, use the available search tools to find relevant information. For more advanced filtering and complex queries, you can use the generate_esql tool to create ES|QL queries and then execute them with the execute_esql tool. When you mention specific events from search results, use the displayEvent or displayEventById tools to show them as interactive cards that users can click to watch the video at that moment. To show a full video asset with a player, use the displayAsset tool with the asset ID. You can also create comprehensive reports using the createReport tool - use this to generate documentation, analysis summaries, or investigation reports with properly formatted markdown content. Provide clear, concise responses based on the search results."
      : "You are a helpful AI assistant for a video streaming platform. You can help users with questions about their video content, streams, and recordings. When discussing specific events, use the displayEvent or displayEventById tools to show them as interactive cards. To show a full video asset with a player, use the displayAsset tool with the asset ID. You can also create comprehensive reports using the createReport tool - use this to generate documentation, analysis summaries, or investigation reports with properly formatted markdown content.";
  }
  
  const result = streamText(streamConfig);

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

