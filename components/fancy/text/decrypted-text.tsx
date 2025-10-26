"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DecryptedTextProps = {
  text: string;
  revealDurationMs?: number;
  scrambleSpeed?: number;
  characters?: string;
  className?: string;
};

export default function DecryptedText({
  text,
  revealDurationMs = 1500,
  scrambleSpeed = 30,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]<>?",
  className,
}: DecryptedTextProps) {
  const [display, setDisplay] = useState(text);
  const startTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const charPool = useMemo(() => characters.split(""), [characters]);

  useEffect(() => {
    // Reset state when text changes
    setDisplay(text);
    startTsRef.current = null;

    const tick = (ts: number) => {
      if (startTsRef.current == null) startTsRef.current = ts;
      const elapsed = ts - startTsRef.current;
      const progress = Math.min(1, elapsed / revealDurationMs);
      const revealCount = Math.floor(progress * text.length);

      setDisplay((prev) => {
        const revealed = text.slice(0, revealCount);
        const remaining = text
          .slice(revealCount)
          .split("")
          .map((ch) => (ch === " " ? " " : charPool[Math.floor(Math.random() * charPool.length)]))
          .join("");
        return revealed + remaining;
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };

    // Keep scrambling unrevealed characters between RAF frames for a smoother effect
    intervalRef.current = setInterval(() => {
      if (startTsRef.current == null) return;
      const elapsed = performance.now() - startTsRef.current;
      const progress = Math.min(1, elapsed / revealDurationMs);
      const revealCount = Math.floor(progress * text.length);
      setDisplay((prev) => {
        const revealed = text.slice(0, revealCount);
        const remaining = text
          .slice(revealCount)
          .split("")
          .map((ch) => (ch === " " ? " " : charPool[Math.floor(Math.random() * charPool.length)]))
          .join("");
        return revealed + remaining;
      });
    }, scrambleSpeed);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, revealDurationMs, scrambleSpeed, charPool]);

  return <span className={className}>{display}</span>;
}


