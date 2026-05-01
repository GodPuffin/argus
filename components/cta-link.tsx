"use client";

import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center gap-2 rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity font-[family-name:var(--font-inter)]";

const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";

type CtaLinkAsLink = {
  href: string;
  onClick?: never;
  type?: never;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href" | "className">;

type CtaLinkAsButton = {
  href?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type" | "className"
>;

type CtaLinkProps = {
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
} & (CtaLinkAsLink | CtaLinkAsButton);

export function CtaLink({
  className,
  disabled,
  children,
  ...props
}: CtaLinkProps) {
  const composed = cn(baseClasses, disabled && disabledClasses, className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props;
    return (
      <Link
        href={href}
        className={composed}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  const { type = "button", onClick, ...rest } = props as CtaLinkAsButton;
  return (
    <button
      type={type}
      className={composed}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
