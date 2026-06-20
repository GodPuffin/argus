"use client";

import type { UIMessage } from "@ai-sdk/react";
import {
  IconLayoutSidebarRightCollapse,
  IconMessageCircle,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CopilotPanel } from "@/components/onboarding/copilot-panel";
import { cn } from "@/lib/utils";

interface CollapsibleCopilotPanelProps {
  messages: UIMessage[];
  status: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  visibleToolCallIds?: Set<string>;
  className?: string;
}

export function CollapsibleCopilotPanel({
  messages,
  status,
  input,
  onInputChange,
  onSend,
  visibleToolCallIds,
  className,
}: CollapsibleCopilotPanelProps) {
  const [open, setOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <motion.aside
      layout
      initial={false}
      animate={{
        width: isDesktop ? (open ? "clamp(380px, 28vw, 420px)" : 56) : "auto",
        height: isDesktop ? "auto" : open ? "42dvh" : 48,
      }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
      className={cn(
        "m-2 min-h-0 shrink-0 overflow-hidden rounded-lg bg-[var(--card)] shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        open ? "h-[42dvh] lg:h-auto" : "h-12 lg:h-auto",
        className,
      )}
    >
      <div className="hidden h-full lg:block">
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative h-full"
            >
              <motion.button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Collapse setup copilot"
                whileTap={{ scale: 0.96 }}
                className="absolute right-3 top-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <IconLayoutSidebarRightCollapse className="size-4" />
              </motion.button>
              <CopilotPanel
                messages={messages}
                status={status}
                input={input}
                onInputChange={onInputChange}
                onSend={onSend}
                visibleToolCallIds={visibleToolCallIds}
              />
            </motion.div>
          ) : (
            <motion.button
              key="rail"
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open setup copilot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="flex h-full w-full cursor-pointer items-start justify-center rounded-lg pt-4 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <IconMessageCircle className="size-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="h-full min-h-0 lg:hidden">
        <CopilotPanel
          messages={messages}
          status={status}
          input={input}
          onInputChange={onInputChange}
          onSend={onSend}
          visibleToolCallIds={visibleToolCallIds}
        />
      </div>
    </motion.aside>
  );
}
