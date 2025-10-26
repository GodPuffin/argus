"use client";

import { SiteHeader } from "@/components/site-header";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Tool, ToolHeader, ToolContent, ToolOutput } from "@/components/ai-elements/tool";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { EventCard } from "@/components/ai-elements/event-card";
import { AssetDisplay } from "@/components/ai-elements/asset";
import { ChatHistoryDropdown } from "@/components/chat-history-dropdown";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport, createIdGenerator } from "ai";
import { useState } from "react";

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
};

interface ChatClientProps {
  id: string;
  initialMessages: UIMessage[];
}

export default function ChatClient({ id, initialMessages }: ChatClientProps) {
  const [selectedModel, setSelectedModel] = useState("claude-haiku-4.5");
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    id,
    messages: initialMessages,
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        chatId: id,
        model: selectedModel,
      },
    }),
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SiteHeader title="AI Chat">
        <ChatHistoryDropdown currentChatId={id} />
      </SiteHeader>
      <div className="@container/main flex flex-1 flex-col overflow-hidden">
        <Conversation className="flex-1 overflow-y-auto">
          <ConversationContent className="mx-auto w-full max-w-4xl p-4">
            {messages.length === 0 && (
              <div className="flex h-full min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <div className="text-center">
                    <h2 className="mb-2 font-medium text-2xl text-muted-foreground">
                      Start a conversation
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Ask me anything about your surveillance footage
                    </p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message: UIMessage, messageIndex: number) => {
              // Check if this is the last message being streamed
              const isLastMessage = messageIndex === messages.length - 1;
              const isCurrentlyStreaming = isLastMessage && status === "streaming";
              
              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent variant="flat">
                    {message.parts.map((part, index) => {
                      // Render text parts
                      if (part.type === "text") {
                        return <Response key={index}>{part.text}</Response>;
                      }
                      
                      // Render reasoning parts
                      if (part.type === "reasoning") {
                        return (
                          <Reasoning key={index} isStreaming={isCurrentlyStreaming} defaultOpen={false}>
                            <ReasoningTrigger />
                            <ReasoningContent>{(part as any).text}</ReasoningContent>
                          </Reasoning>
                        );
                      }
                    
                    // Render event display tools with EventCard
                    if (part.type === "tool-displayEvent" || part.type === "tool-displayEventById") {
                      const state = (part as any).state;
                      
                      if (state === "input-available") {
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground my-2">
                            <div className="animate-pulse">Loading event...</div>
                          </div>
                        );
                      }
                      
                      if (state === "output-available") {
                        return (
                          <div key={index} className="my-3">
                            <EventCard {...(part as any).output} />
                          </div>
                        );
                      }
                      
                      if (state === "output-error") {
                        return (
                          <div key={index} className="my-2 text-sm text-destructive">
                            Error loading event: {(part as any).errorText}
                          </div>
                        );
                      }
                      
                      return null;
                    }
                    
                    // Render asset display tools with AssetDisplay
                    if (part.type === "tool-displayAsset") {
                      const state = (part as any).state;
                      
                      if (state === "input-available") {
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground my-2">
                            <div className="animate-pulse">Loading video...</div>
                          </div>
                        );
                      }
                      
                      if (state === "output-available") {
                        return (
                          <div key={index} className="my-3">
                            <AssetDisplay {...(part as any).output} />
                          </div>
                        );
                      }
                      
                      if (state === "output-error") {
                        return (
                          <div key={index} className="my-2 text-sm text-destructive">
                            Error loading video: {(part as any).errorText}
                          </div>
                        );
                      }
                      
                      return null;
                    }
                    
                    // Render tool invocations (both static and dynamic)
                    if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                      const toolName = part.type === "dynamic-tool" 
                        ? (part as any).toolName 
                        : part.type.replace("tool-", "");
                      
                      const displayName = TOOL_NAME_MAP[toolName] || toolName;
                      
                      const toolType = part.type === "dynamic-tool" 
                        ? `tool-${(part as any).toolName}` as `tool-${string}`
                        : part.type as `tool-${string}`;
                      
                      return (
                        <Tool key={index}>
                          <ToolHeader
                            state={(part as any).state}
                            title={displayName}
                            type={toolType}
                          />
                          {(part as any).state === "output-available" && (
                            <ToolContent>
                              <ToolOutput
                                output={(part as any).output}
                                errorText={(part as any).errorText}
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

        <div className="border-t bg-background p-4">
          <div className="mx-auto w-full max-w-4xl">
            <PromptInput
              onSubmit={(message, event) => {
                event.preventDefault();
                if (input.trim() && status === "ready") {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
            >
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your videos..."
                value={input}
                disabled={status !== "ready"}
              />
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputModelSelect
                    onValueChange={setSelectedModel}
                    value={selectedModel}
                  >
                    <PromptInputModelSelectTrigger>
                      <PromptInputModelSelectValue />
                    </PromptInputModelSelectTrigger>
                    <PromptInputModelSelectContent>
                      <PromptInputModelSelectItem value="claude-sonnet-4.5">
                        Claude Sonnet 4.5
                      </PromptInputModelSelectItem>
                      <PromptInputModelSelectItem value="claude-haiku-4.5">
                        Claude Haiku 4.5
                      </PromptInputModelSelectItem>
                      <PromptInputModelSelectItem value="kimi-k2">
                        Kimi K2
                      </PromptInputModelSelectItem>
                    </PromptInputModelSelectContent>
                  </PromptInputModelSelect>
                </PromptInputTools>
                <PromptInputSubmit disabled={status !== "ready"} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}

