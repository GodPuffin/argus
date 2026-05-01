import type * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  bleed?: boolean;
}

export function PageContainer({
  className,
  bleed = false,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "@container/main mx-auto flex w-full min-h-0 flex-1 flex-col gap-6 px-6 py-6 sm:px-10 lg:px-12 lg:py-8",
        !bleed && "max-w-[1500px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
