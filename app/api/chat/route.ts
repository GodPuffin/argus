import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { lettaCloud } from "@letta-ai/vercel-ai-sdk-provider";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { aiTools, onboardingTools } from "@/lib/ai-tools";
import { extractTextFromParts, saveChat } from "@/lib/chat-store";
import { isDemoMode } from "@/lib/demo/flag";
import { OPENROUTER_DEFAULT_MODEL, openrouter } from "@/lib/demo/openrouter";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/demo/rate-limit";
import {
  type ScriptedCall,
  scriptedAssistantText,
  scriptedOnboardingTurn,
} from "@/lib/demo/scripted-copilot";
import {
  DEMO_SYSTEM_PROMPT,
  ELASTIC_SYSTEM_PROMPT,
  FALLBACK_SYSTEM_PROMPT,
  ONBOARDING_SYSTEM_PROMPT,
} from "@/lib/prompts";

export const maxDuration = 30;

interface ScriptContextInput {
  hasOrgName?: boolean;
  cameraNames?: string[];
  ruleLabels?: string[];
}

/** Pull the most recent user message's text out of UI messages. */
function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "user") continue;
    return extractTextFromParts(m).trim();
  }
  return "";
}

/** Stream a fixed assistant reply plus optional tool calls, with no LLM. */
function scriptedStreamResponse(text: string, calls: ScriptedCall[]) {
  const stream = createUIMessageStream({
    execute({ writer }) {
      // The UI message stream envelope (start … finish) is required for
      // useChat to mark the turn complete — without it the client streams
      // forever. createUIMessageStream does NOT add these automatically.
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });

      const textId = generateId();
      writer.write({ type: "text-start", id: textId });
      writer.write({ type: "text-delta", id: textId, delta: text });
      writer.write({ type: "text-end", id: textId });

      for (const call of calls) {
        const toolCallId = generateId();
        writer.write({
          type: "tool-input-available",
          toolCallId,
          toolName: call.toolName,
          input: call.input,
        });
        // Scripted onboarding tools don't run server-side; the client renders
        // the call's input directly, so echo it back as the output.
        writer.write({
          type: "tool-output-available",
          toolCallId,
          output: call.input,
        });
      }

      writer.write({ type: "finish-step" });
      writer.write({ type: "finish" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request) {
  const {
    messages,
    chatId,
    model: selectedModel,
    onboarding,
    sessionContext,
  } = (await req.json()) as {
    messages: UIMessage[];
    chatId: string;
    model?: string;
    onboarding?: boolean;
    sessionContext?: ScriptContextInput;
  };
  const isOnboarding =
    onboarding === true || selectedModel === "onboarding-guide";

  // Elastic Agent Builder MCP client (disabled in demo).
  let mcpClient:
    | Awaited<ReturnType<typeof experimental_createMCPClient>>
    | undefined;
  let tools: Record<string, unknown> = isOnboarding
    ? { ...onboardingTools }
    : { ...aiTools };

  const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
  const apiKey = process.env.ELASTICSEARCH_API_KEY;

  if (!isDemoMode && elasticsearchUrl && apiKey) {
    try {
      // Agent Builder lives on Kibana, not Elasticsearch — derive its host.
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

      const mcpTools = await mcpClient.tools();
      tools = { ...aiTools, ...mcpTools };
      console.log(
        "Connected to Elastic MCP server, tools:",
        Object.keys(tools),
      );
    } catch (error) {
      console.error("Failed to connect to Elastic MCP server:", error);
      // Continue without MCP tools if connection fails.
    }
  }

  let model;
  let effectiveModel = selectedModel;

  if (isDemoMode) {
    // Best-effort per-IP rate limit so the public demo can't be hammered.
    const rl = checkRateLimit(clientKeyFromRequest(req));
    if (!rl.ok) {
      return scriptedStreamResponse(
        `You're sending messages a little fast — give me about ${rl.retryAfterSeconds}s and try again.`,
        [],
      );
    }

    // Provider tiering: Anthropic Haiku → OpenRouter → deterministic scripted.
    if (process.env.ANTHROPIC_API_KEY) {
      model = anthropic("claude-haiku-4-5-20251001");
      effectiveModel = "anthropic";
    } else if (process.env.OPENROUTER_API_KEY) {
      const demoModel =
        selectedModel === "claude-sonnet-4.5"
          ? "anthropic/claude-3.5-sonnet"
          : selectedModel === "kimi-k2"
            ? "moonshotai/kimi-k2"
            : selectedModel === "claude-haiku-4.5"
              ? "anthropic/claude-3.5-haiku"
              : OPENROUTER_DEFAULT_MODEL;
      model = openrouter(demoModel);
      effectiveModel = "openrouter";
    } else {
      // No provider key configured — never 500. Stream a scripted reply that
      // still drives the onboarding wizard via tool calls.
      const userText = lastUserText(messages);
      if (isOnboarding) {
        const ctx: ScriptContextInput = sessionContext ?? {};
        const { text, calls } = scriptedOnboardingTurn(userText, {
          hasOrgName: ctx.hasOrgName ?? false,
          existingCameraNames: ctx.cameraNames ?? [],
          existingRuleLabels: ctx.ruleLabels ?? [],
        });
        return scriptedStreamResponse(text, calls);
      }
      return scriptedStreamResponse(scriptedAssistantText(), []);
    }
  } else {
    if (
      !process.env.ANTHROPIC_API_KEY &&
      !process.env.GROQ_API_KEY &&
      !process.env.LETTA_API_KEY
    ) {
      return new Response(
        "Missing API keys. Please configure ANTHROPIC_API_KEY, GROQ_API_KEY, or LETTA_API_KEY.",
        { status: 500 },
      );
    }

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
          return new Response(
            "LETTA_AGENT_ID not configured. Please set the ID of your 'stateful argus' agent.",
            { status: 500 },
          );
        }
        model = lettaCloud();
        break;

      default:
        // No explicit model selected — default to Claude Haiku.
        if (process.env.ANTHROPIC_API_KEY) {
          model = anthropic("claude-haiku-4-5-20251001");
        } else {
          return new Response("No API keys configured", { status: 500 });
        }
    }
  }

  const modelMessages = convertToModelMessages(messages);

  // Provider option shapes differ per provider (anthropic.thinking vs.
  // letta.agent) and the SDK types them loosely, so keep this as a bag.
  const providerOptions: any = {};
  if (!isDemoMode) {
    providerOptions.anthropic = {
      thinking: {
        type: "enabled",
        budgetTokens: 10000,
      },
    };
  }

  if (!isDemoMode && selectedModel === "stateful-argus") {
    providerOptions.letta = {
      agent: {
        id: process.env.LETTA_AGENT_ID,
        maxSteps: 10,
        streamTokens: true,
      },
    };
  }

  // `system` is added conditionally below, so the config stays loosely typed.
  const streamConfig: any = {
    model,
    messages: modelMessages,
    tools,
    providerOptions,
    stopWhen: stepCountIs(10),
  };

  // Letta agents carry their own system prompt from Letta Cloud; injecting one
  // here would override it, so only set `system` for the other providers.
  if (effectiveModel !== "stateful-argus") {
    const currentDateTime = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });

    const baseSystemPrompt = `Current date and time: ${currentDateTime}\n\n`;

    if (isOnboarding) {
      streamConfig.system = baseSystemPrompt + ONBOARDING_SYSTEM_PROMPT;
    } else if (isDemoMode) {
      streamConfig.system = baseSystemPrompt + DEMO_SYSTEM_PROMPT;
    } else {
      streamConfig.system =
        elasticsearchUrl && apiKey
          ? baseSystemPrompt + ELASTIC_SYSTEM_PROMPT
          : baseSystemPrompt + FALLBACK_SYSTEM_PROMPT;
    }
  }

  const result = streamText(streamConfig);

  // Consume the stream so generation completes even if the client disconnects.
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
