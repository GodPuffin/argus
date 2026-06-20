"use client";

import { useEffect, useState } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function BrailleLoader({
  className = "text-2xl",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);

  return (
    <span role="status" aria-label={label} className={className}>
      <span aria-hidden>{FRAMES[frame]}</span>
    </span>
  );
}
