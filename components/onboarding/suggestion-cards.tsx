"use client";

import { motion } from "framer-motion";
import { SUGGESTIONS } from "@/components/onboarding/constants";
import { cn } from "@/lib/utils";

interface SuggestionCardsProps {
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Grid of example prompts. Selecting one submits it. Call sites control the
 * grid columns via `className` (e.g. `sm:grid-cols-3` on the hero).
 */
export function SuggestionCards({
  onSelect,
  disabled = false,
  className,
}: SuggestionCardsProps) {
  return (
    <div className={cn("grid w-full gap-2", className)}>
      {SUGGESTIONS.map((suggestion) => (
        <motion.button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="cursor-pointer rounded-lg bg-card px-3.5 py-3 text-left text-muted-foreground text-xs leading-5 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 dark:ring-white/10"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}
