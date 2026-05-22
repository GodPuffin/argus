import type * as React from "react";
import { cn } from "@/lib/utils";

function Surface({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface"
      className={cn(
        "flex flex-col bg-background border border-border",
        className,
      )}
      {...props}
    />
  );
}

function SurfaceHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-header"
      className={cn(
        "flex flex-col gap-1 px-5 py-4 border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

function SurfaceTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="surface-title"
      className={cn(
        "font-[family-name:var(--font-inter)] font-semibold text-base tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function SurfaceDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-description"
      className={cn(
        "font-[family-name:var(--font-inter)] text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SurfaceContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-content"
      className={cn("px-5 py-4", className)}
      {...props}
    />
  );
}

function SurfaceFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="surface-footer"
      className={cn(
        "flex items-center px-5 py-4 border-t border-border",
        className,
      )}
      {...props}
    />
  );
}

export {
  Surface,
  SurfaceHeader,
  SurfaceTitle,
  SurfaceDescription,
  SurfaceContent,
  SurfaceFooter,
};
