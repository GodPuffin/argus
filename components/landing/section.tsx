import type * as React from "react";
import { cn } from "@/lib/utils";

function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "w-full bg-background text-foreground border-t border-border",
        className,
      )}
      {...props}
    />
  );
}

function SectionInner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-20 lg:py-28",
        className,
      )}
      {...props}
    />
  );
}

export { Section, SectionInner };
