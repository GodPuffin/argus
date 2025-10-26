"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "revealed-pointer";
}

const LuxeCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    if (variant === "revealed-pointer") {
      return (
        <div
          ref={ref}
          onMouseMove={(e) => {
            const { left, top } = e.currentTarget.getBoundingClientRect();
            mouseX.set(e.clientX - left);
            mouseY.set(e.clientY - top);
          }}
          className="group relative overflow-hidden rounded-xl bg-border/50 p-px"
        >
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.25), transparent 70%)`,
            }}
          />
          <div
            {...props}
            className={cn(
              "relative select-none rounded-xl bg-card h-[-webkit-fill-available]",
              className,
            )}
          >
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-sm",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

LuxeCard.displayName = "LuxeCard";

const LuxeCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
LuxeCardHeader.displayName = "LuxeCardHeader";

const LuxeCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
LuxeCardTitle.displayName = "LuxeCardTitle";

const LuxeCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
LuxeCardDescription.displayName = "LuxeCardDescription";

const LuxeCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
LuxeCardContent.displayName = "LuxeCardContent";

const LuxeCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
LuxeCardFooter.displayName = "LuxeCardFooter";

export {
  LuxeCard,
  LuxeCardHeader,
  LuxeCardFooter,
  LuxeCardTitle,
  LuxeCardDescription,
  LuxeCardContent,
};
