"use client";

import type { UIMessage } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Tool, ToolContent, ToolHeader } from "@/components/ai-elements/tool";
import { Composer } from "@/components/onboarding/composer";
import { TOOL_TITLES, toolLabel } from "@/components/onboarding/constants";
import type {
  TextPart,
  ToolPart,
} from "@/components/onboarding/onboarding-types";
import { isBusy } from "@/components/onboarding/status";
import { SuggestionCards } from "@/components/onboarding/suggestion-cards";
import { cn } from "@/lib/utils";

interface CopilotPanelProps {
  messages: UIMessage[];
  status: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  visibleToolCallIds?: Set<string>;
  className?: string;
}

export function CopilotPanel({
  messages,
  status,
  input,
  onInputChange,
  onSend,
  visibleToolCallIds,
  className,
}: CopilotPanelProps) {
  const busy = isBusy(status);

  const submitText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-background",
        className,
      )}
    >
      <Conversation className="min-h-0 flex-1 overflow-y-auto">
        <ConversationContent className="mx-auto flex w-full max-w-3xl flex-col gap-1 p-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex h-full min-h-[26rem] flex-col justify-center gap-6 py-3 text-center"
            >
              <div className="flex flex-col gap-3">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.22em]">
                  Argus setup
                </p>
                <h2 className="font-semibold text-3xl text-foreground tracking-tight">
                  Describe your space.
                </h2>
                <p className="mx-auto max-w-sm text-muted-foreground text-sm leading-6">
                  Tell Argus what kind of site you run, which areas need
                  cameras, and what the AI should flag.
                </p>
              </div>

              <Composer
                input={input}
                busy={busy}
                onInputChange={onInputChange}
                onSubmit={submitText}
                sendLabel="Send setup request"
              />
              <SuggestionCards onSelect={submitText} disabled={busy} />
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Message from={message.role}>
                  <MessageContent variant="flat">
                    {message.parts.map((part) => {
                      if (part.type === "text") {
                        const text = (part as TextPart).text;
                        return (
                          <Response key={`${message.id}:text:${text}`}>
                            {text}
                          </Response>
                        );
                      }

                      if (
                        typeof part.type === "string" &&
                        part.type.startsWith("tool-")
                      ) {
                        const toolPart = part as ToolPart;
                        const callId = toolPart.toolCallId;
                        if (
                          visibleToolCallIds &&
                          callId &&
                          !visibleToolCallIds.has(callId)
                        ) {
                          return null;
                        }

                        const state = toolPart.state ?? "input-available";
                        const label = toolLabel(part.type, toolPart.output);
                        const title =
                          TOOL_TITLES[part.type] ??
                          part.type.replace("tool-", "");

                        return (
                          <Tool
                            key={`${message.id}:tool:${callId ?? part.type}`}
                          >
                            <ToolHeader
                              state={state}
                              title={title}
                              type={part.type as `tool-${string}`}
                            />
                            {state === "output-available" && (
                              <ToolContent>
                                <div className="px-4 pb-4 text-muted-foreground text-sm">
                                  {label}
                                </div>
                              </ToolContent>
                            )}
                          </Tool>
                        );
                      }

                      return null;
                    })}
                  </MessageContent>
                </Message>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {busy && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <Message from="assistant">
                  <MessageContent variant="flat">
                    <Loader className="my-2" />
                  </MessageContent>
                </Message>
              </motion.div>
            )}
          </AnimatePresence>
        </ConversationContent>
      </Conversation>

      {messages.length > 0 && (
        <div className="shrink-0 bg-background p-4">
          <Composer
            input={input}
            busy={busy}
            compact
            onInputChange={onInputChange}
            onSubmit={submitText}
            sendLabel="Send setup request"
          />
        </div>
      )}
    </div>
  );
}
