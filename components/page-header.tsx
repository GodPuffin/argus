import type * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-[family-name:var(--font-inter)] font-semibold text-3xl sm:text-4xl tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="font-[family-name:var(--font-inter)] text-base text-muted-foreground text-pretty max-w-[60ch]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 sm:shrink-0">{actions}</div>
      )}
    </div>
  );
}
