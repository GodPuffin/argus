"use client";

import { IconArrowUp } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComposerProps {
  input: string;
  busy: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
  /** Accessible label for the send button. */
  sendLabel: string;
  /** Footer hint shown beside the send button. */
  hint?: string;
  placeholder?: string;
  /** Tighter min-heights and smaller text for the docked panel composer. */
  compact?: boolean;
  className?: string;
}

/**
 * Shared composer: card → muted box → textarea (Enter-to-submit) → footer hint
 * + send button. Used by the onboarding hero and the copilot panel.
 */
export function Composer({
  input,
  busy,
  onInputChange,
  onSubmit,
  sendLabel,
  hint = "Cameras, rules, alerts, and launch settings",
  placeholder = "Describe your space...",
  compact = false,
  className,
}: ComposerProps) {
  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    onSubmit(text);
  };

  return (
    <motion.div
      layout
      className={cn(
        "w-full rounded-xl bg-card p-2 shadow-xl shadow-black/10 ring-1 ring-black/5 dark:shadow-black/30 dark:ring-white/10",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 rounded-lg bg-muted p-3 text-left",
          compact ? "min-h-24" : "min-h-28",
        )}
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
          disabled={busy}
          placeholder={placeholder}
          className={cn(
            "resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground",
            compact ? "min-h-14 text-sm" : "min-h-20 text-base",
          )}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">{hint}</span>
          <Button
            asChild
            size="icon"
            className="shrink-0 cursor-pointer bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            <motion.button
              type="button"
              onClick={submit}
              disabled={!input.trim() || busy}
              aria-label={sendLabel}
              whileTap={{ scale: 0.94 }}
            >
              <IconArrowUp className="size-4" />
            </motion.button>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
