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
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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
};

export default function AIChatPage() {
  const [selectedModel, setSelectedModel] = useState("claude-haiku-4.5");
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        model: selectedModel,
      },
    }),
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SiteHeader title="AI Chat" />
      <div className="@container/main flex flex-1 flex-col overflow-hidden">
        <Conversation className="flex-1 overflow-y-auto">
          <ConversationContent className="mx-auto w-full max-w-4xl p-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h2 className="mb-2 font-medium text-2xl text-muted-foreground">
                    Start a conversation
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Ask me anything about your video streams
                  </p>
                </div>
              </div>
            )}

            {messages.map((message: UIMessage) => (
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
                        <Reasoning key={index} isStreaming={status === "streaming"} defaultOpen={false}>
                          <ReasoningTrigger />
                          <ReasoningContent>{(part as any).text}</ReasoningContent>
                        </Reasoning>
                      );
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
            ))}

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
