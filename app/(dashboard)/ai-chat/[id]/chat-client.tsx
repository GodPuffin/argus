"use client";

import type { UIMessage } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import {
  IconArrowUp,
  IconBolt,
  IconDatabase,
  IconFeather,
  IconUniverse,
} from "@tabler/icons-react";
import { createIdGenerator, DefaultChatTransport, type ToolUIPart } from "ai";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { AssetDisplay } from "@/components/ai-elements/asset";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { EventCard } from "@/components/ai-elements/event-card";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Report } from "@/components/ai-elements/report";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ChatHistoryDropdown } from "@/components/chat-history-dropdown";
import { SiteHeader } from "@/components/site-header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Human-readable tool names
const TOOL_NAME_MAP: Record<string, string> = {
  platform_core_search: "Search Database",
  platform_core_get_document_by_id: "Get Document",
  platform_core_execute_esql: "Execute Query",
  platform_core_generate_esql: "Generate Query",
  platform_core_get_index_mapping: "Get Index Mapping",
  platform_core_list_indices: "List Indices",
  platform_core_index_explorer: "Explore Index",
  displayEvent: "Event",
  displayEventById: "Event",
  displayAsset: "Video Asset",
  createReport: "Create Report",
};

interface ChatClientProps {
  id: string;
  initialMessages: UIMessage[];
}

/** Shape of a tool-invocation message part as streamed by the AI SDK. */
interface ToolMessagePart {
  state?: ToolUIPart["state"];
  output?: ToolUIPart["output"];
  errorText?: ToolUIPart["errorText"];
  toolName?: string;
  text?: string;
}

/**
 * Renders a tool-invocation part's lifecycle: a loading line while running,
 * the output via `renderOutput` when available, and an error line on failure.
 */
function ToolStatePart({
  part,
  loadingLabel,
  errorLabel,
  renderOutput,
}: {
  part: ToolMessagePart;
  loadingLabel: string;
  errorLabel: string;
  renderOutput: (output: any) => ReactNode;
}) {
  if (part.state === "input-available") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground my-2">
        <div className="animate-pulse">{loadingLabel}</div>
      </div>
    );
  }
  if (part.state === "output-available") {
    return <div className="my-3">{renderOutput(part.output)}</div>;
  }
  if (part.state === "output-error") {
    return (
      <div className="my-2 text-sm text-destructive">
        {errorLabel}: {part.errorText}
      </div>
    );
  }
  return null;
}

const STARTER_PROMPTS = [
  "Show me the highest-severity events",
  "What did the cameras detect today?",
  "Summarize activity at the loading dock",
  "Create an incident report for this week",
];

export default function ChatClient({ id, initialMessages }: ChatClientProps) {
  const [selectedModel, setSelectedModel] = useState("claude-haiku-4.5");
  const [input, setInput] = useState("");
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  // Created once per chat id; reads the selected model at request time via ref.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          chatId: id,
          model: selectedModelRef.current,
        }),
      }),
    [id],
  );

  const { messages, sendMessage, status } = useChat({
    id,
    messages: initialMessages,
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    transport,
  });
  const ready = status === "ready";

  const submitPrompt = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !ready) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const modelPicker = (
    <PromptInputTools>
      <PromptInputModelSelect
        onValueChange={setSelectedModel}
        value={selectedModel}
      >
        <PromptInputModelSelectTrigger>
          <PromptInputModelSelectValue />
        </PromptInputModelSelectTrigger>
        <PromptInputModelSelectContent>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PromptInputModelSelectItem value="claude-sonnet-4.5">
                  <IconUniverse className="size-4 mr-2" />
                  Claude Sonnet 4.5
                </PromptInputModelSelectItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                Advanced reasoning, complex analysis, and deep thinking
                capabilities
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <PromptInputModelSelectItem value="claude-haiku-4.5">
                  <IconFeather className="size-4 mr-2" />
                  Claude Haiku 4.5
                </PromptInputModelSelectItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                Fast, efficient responses with excellent accuracy
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <PromptInputModelSelectItem value="kimi-k2">
                  <IconBolt className="size-4 mr-2" />
                  Kimi K2 (Provided by Groq)
                </PromptInputModelSelectItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                High-performance alternative with rapid response times
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <PromptInputModelSelectItem value="stateful-argus">
                  <IconDatabase className="size-4 mr-2" />
                  Stateful (Letta Agent)
                </PromptInputModelSelectItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                Long-term memory, file system access, and self-improvement
                capabilities
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </PromptInputModelSelectContent>
      </PromptInputModelSelect>
    </PromptInputTools>
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <SiteHeader title="AI Chat">
        <ChatHistoryDropdown currentChatId={id} />
      </SiteHeader>
      <div className="@container/main flex min-h-0 flex-1 flex-col overflow-hidden">
        <Conversation className="min-h-0 flex-1 overflow-y-auto">
          <ConversationContent className="mx-auto flex min-h-full w-full max-w-4xl flex-col p-4">
            {messages.length === 0 && (
              <div className="relative flex min-h-[520px] flex-1 items-center justify-center overflow-hidden px-2 py-8">
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(ellipse_at_bottom,rgba(94,106,210,0.18),rgba(39,166,68,0.08)_42%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(130,143,255,0.16),rgba(39,166,68,0.08)_42%,transparent_72%)]" />
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-7 text-center"
                >
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                      Argus AI
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                      Ask about your footage.
                    </h1>
                    <p className="mx-auto max-w-xl text-muted-foreground text-sm leading-6 sm:text-base">
                      Search events, open recordings, summarize activity, and
                      generate investigation reports from the demo workspace.
                    </p>
                  </div>

                  <ChatHeroComposer
                    input={input}
                    ready={ready}
                    helper="Events, recordings, cameras, and reports"
                    modelPicker={modelPicker}
                    onInputChange={setInput}
                    onSubmit={submitPrompt}
                  />

                  <div className="grid w-full gap-2 sm:grid-cols-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <motion.button
                        key={prompt}
                        type="button"
                        onClick={() => submitPrompt(prompt)}
                        disabled={!ready}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="cursor-pointer rounded-lg bg-card px-3.5 py-3 text-left text-muted-foreground text-sm leading-5 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 dark:ring-white/10"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {messages.map((message: UIMessage, messageIndex: number) => {
              // Check if this is the last message being streamed
              const isLastMessage = messageIndex === messages.length - 1;
              const isCurrentlyStreaming =
                isLastMessage && status === "streaming";

              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent variant="flat">
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return <Response key={index}>{part.text}</Response>;
                      }

                      if (part.type === "reasoning") {
                        return (
                          <Reasoning
                            key={index}
                            isStreaming={isCurrentlyStreaming}
                            defaultOpen={false}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {(part as ToolMessagePart).text ?? ""}
                            </ReasoningContent>
                          </Reasoning>
                        );
                      }

                      if (
                        part.type === "tool-displayEvent" ||
                        part.type === "tool-displayEventById"
                      ) {
                        return (
                          <ToolStatePart
                            key={index}
                            part={part as ToolMessagePart}
                            loadingLabel="Loading event..."
                            errorLabel="Error loading event"
                            renderOutput={(output) => <EventCard {...output} />}
                          />
                        );
                      }

                      if (part.type === "tool-displayAsset") {
                        return (
                          <ToolStatePart
                            key={index}
                            part={part as ToolMessagePart}
                            loadingLabel="Loading video..."
                            errorLabel="Error loading video"
                            renderOutput={(output) => (
                              <AssetDisplay {...output} />
                            )}
                          />
                        );
                      }

                      if (part.type === "tool-createReport") {
                        return (
                          <ToolStatePart
                            key={index}
                            part={part as ToolMessagePart}
                            loadingLabel="Creating report..."
                            errorLabel="Error creating report"
                            renderOutput={(output) => <Report data={output} />}
                          />
                        );
                      }

                      // Generic fallback for any other tool invocation.
                      if (
                        part.type.startsWith("tool-") ||
                        part.type === "dynamic-tool"
                      ) {
                        const p = part as ToolMessagePart;
                        const toolName =
                          part.type === "dynamic-tool"
                            ? p.toolName
                            : part.type.replace("tool-", "");

                        const displayName =
                          TOOL_NAME_MAP[toolName ?? ""] || toolName;

                        const toolType =
                          part.type === "dynamic-tool"
                            ? (`tool-${p.toolName}` as `tool-${string}`)
                            : (part.type as `tool-${string}`);

                        return (
                          <Tool key={index}>
                            <ToolHeader
                              state={p.state ?? "input-streaming"}
                              title={displayName}
                              type={toolType}
                            />
                            {p.state === "output-available" && (
                              <ToolContent>
                                <ToolOutput
                                  output={p.output}
                                  errorText={p.errorText}
                                />
                              </ToolContent>
                            )}
                          </Tool>
                        );
                      }

                      return null;
                    })}
                  </MessageContent>
                </Message>
              );
            })}

            {(status === "streaming" || status === "submitted") && (
              <Message from="assistant">
                <MessageContent variant="flat">
                  <Loader className="my-2" />
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
        </Conversation>

        {messages.length > 0 && (
          <div className="bg-background p-4">
            <div className="mx-auto w-full max-w-4xl">
              <ChatHeroComposer
                compact
                input={input}
                ready={ready}
                helper="Events, recordings, cameras, and reports"
                modelPicker={modelPicker}
                onInputChange={setInput}
                onSubmit={submitPrompt}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatHeroComposer({
  input,
  ready,
  helper,
  modelPicker,
  compact = false,
  onInputChange,
  onSubmit,
}: {
  input: string;
  ready: boolean;
  helper: string;
  modelPicker: ReactNode;
  compact?: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
}) {
  const submit = () => {
    if (!ready) return;
    onSubmit(input);
  };

  return (
    <motion.div
      layout
      className="w-full rounded-xl bg-card p-2 shadow-xl shadow-black/10 ring-1 ring-black/5 dark:shadow-black/30 dark:ring-white/10"
    >
      <div
        className={`flex flex-col gap-3 rounded-lg bg-muted p-3 text-left ${
          compact ? "min-h-24" : "min-h-28"
        }`}
      >
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          disabled={!ready}
          placeholder="Ask about your videos..."
          className={`resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground ${
            compact ? "min-h-14 text-sm" : "min-h-20 text-base"
          }`}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <span className="hidden text-muted-foreground text-xs sm:inline">
              {helper}
            </span>
            {modelPicker}
          </div>
          <motion.button
            type="button"
            onClick={submit}
            disabled={!input.trim() || !ready}
            aria-label="Send message"
            whileTap={{ scale: 0.94 }}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            <IconArrowUp className="size-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
