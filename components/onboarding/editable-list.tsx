"use client";

import { IconPlus, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { ONBOARDING_INPUT_CLASS } from "@/components/onboarding/constants";
import { cn } from "@/lib/utils";

interface EditableListItem {
  id: string;
}

interface EditableListProps<T extends EditableListItem> {
  items: T[];
  /** Row content rendered inside the removable row. */
  renderItem: (item: T) => React.ReactNode;
  /** Add an item from the (trimmed, non-empty) input value. */
  onAdd: (value: string) => void;
  onRemove: (id: string) => void;
  /** Accessible label for a row's remove button, given the item. */
  removeLabel: (item: T) => string;
  placeholder: string;
  className?: string;
}

/**
 * Generic editable list: an animated stack of removable rows plus an input and
 * add button. Used for the cameras and detection-rule sections.
 */
export function EditableList<T extends EditableListItem>({
  items,
  renderItem,
  onAdd,
  onRemove,
  removeLabel,
  placeholder,
  className,
}: EditableListProps<T>) {
  const [value, setValue] = useState("");

  const add = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between gap-3 rounded-md bg-[var(--muted)] px-3 py-2"
          >
            {renderItem(item)}
            <motion.button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={removeLabel(item)}
              whileTap={{ scale: 0.94 }}
              className="shrink-0 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <IconX className="size-4" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
          className={ONBOARDING_INPUT_CLASS}
        />
        <AddButton onClick={add} />
      </div>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Add"
      whileTap={{ scale: 0.94 }}
      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
    >
      <IconPlus className="size-4" />
    </motion.button>
  );
}
