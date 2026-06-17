"use client";

import { useEffect, useState } from "react";

export type BrailleVariant = "matrix" | "wave" | "pulse" | "vortex";

export const DENSITY_CHARS = Array.from({ length: 256 }, (_, i) => {
  let count = 0;
  for (let b = 0; b < 8; b++) {
    if ((i >> b) & 1) count++;
  }
  return { char: String.fromCharCode(0x2800 + i), count };
})
  .sort((a, b) => a.count - b.count)
  .map((x) => x.char);

const VARIANT_STYLES: Record<
  BrailleVariant,
  { colorClass: string; duration: string }
> = {
  matrix: {
    colorClass: "from-emerald-400/90 via-teal-500/70 to-emerald-600/90",
    duration: "8s",
  },
  wave: {
    colorClass: "from-orange-400/90 via-amber-500/70 to-rose-600/90",
    duration: "12s",
  },
  pulse: {
    colorClass: "from-indigo-400/90 via-purple-500/70 to-blue-600/90",
    duration: "10s",
  },
  vortex: {
    colorClass: "from-yellow-300/90 via-rose-500/80 to-red-700/90",
    duration: "6s",
  },
};

/**
 * Shared animation loop that fills a `rows x cols` braille grid on an interval.
 * `enabled === false` pauses the loop. `compute` returns the density value
 * (0..1) for a cell given the current frame count.
 */
function useBrailleGrid(
  rows: number,
  cols: number,
  enabled: boolean,
  compute: (
    r: number,
    c: number,
    frameCount: number,
    cols: number,
    rows: number,
  ) => number,
  deps: React.DependencyList,
) {
  const [grid, setGrid] = useState<string[][]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enabled) return;
    let frameCount = 0;

    const id = setInterval(() => {
      frameCount++;
      const next: string[][] = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(""));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = compute(r, c, frameCount, cols, rows);
          const charIdx = Math.min(255, Math.max(0, Math.floor(v * 255)));
          next[r][c] = DENSITY_CHARS[charIdx];
        }
      }
      setGrid(next);
    }, 50);

    return () => clearInterval(id);
  }, deps);

  return grid;
}

export function MiniBrailleBg({
  variant,
  active,
}: {
  variant: BrailleVariant;
  active: boolean;
}) {
  const rows = 25;
  const cols = 45;

  // `matrix` keeps per-column drop state that advances every frame; recreated
  // whenever the loop (re)starts via the dependency list below.
  const grid = useBrailleGrid(
    rows,
    cols,
    active,
    (() => {
      const drops = Array.from({ length: cols }, () => ({
        y: Math.random() * -rows,
        speed: 0.2 + Math.random() * 0.5,
        length: 5 + Math.random() * 10,
      }));
      let lastFrame = 0;

      return (r, c, frameCount, cols, rows) => {
        // Advance drops once per frame (on the first cell of each frame).
        if (variant === "matrix" && frameCount !== lastFrame) {
          lastFrame = frameCount;
          for (let i = 0; i < cols; i++) {
            drops[i].y += drops[i].speed;
            if (drops[i].y - drops[i].length > rows) {
              drops[i].y = Math.random() * -10;
              drops[i].speed = 0.2 + Math.random() * 0.5;
            }
          }
        }

        let v = 0;
        if (variant === "matrix") {
          const drop = drops[c];
          const dist = drop.y - r;
          if (dist >= 0 && dist < drop.length) {
            v = 1 - dist / drop.length;
            v = v * 0.8 + Math.random() * 0.2;
          } else {
            v = Math.random() > 0.98 ? Math.random() * 0.2 : 0;
          }
        } else if (variant === "wave") {
          const phase1 = frameCount * 0.1 + c * 0.2;
          const phase2 = frameCount * 0.05 + c * 0.1;
          const y1 = Math.sin(phase1) * 5 + rows / 2;
          const y2 = Math.cos(phase2) * 5 + rows / 2;
          const dist1 = Math.abs(r - y1);
          const dist2 = Math.abs(r - y2);
          const dist = Math.min(dist1, dist2);
          v = dist < 4 ? 1 - dist / 4 : 0;
          v = v * (0.7 + Math.random() * 0.3);
        } else if (variant === "pulse") {
          const t = frameCount * 0.05;
          const x1 = cols / 2 + Math.sin(t) * 10;
          const y1 = rows / 2 + Math.cos(t * 1.3) * 5;
          const x2 = cols / 2 + Math.cos(t * 0.8) * 15;
          const y2 = rows / 2 + Math.sin(t * 1.1) * 8;
          const d1 = Math.sqrt((c - x1) ** 2 + ((r - y1) * 2) ** 2);
          const d2 = Math.sqrt((c - x2) ** 2 + ((r - y2) * 2) ** 2);
          v = Math.max(d1 < 12 ? 1 - d1 / 12 : 0, d2 < 12 ? 1 - d2 / 12 : 0);
          if (v > 0) v = v * 0.8 + Math.random() * 0.2;
        } else if (variant === "vortex") {
          const t = frameCount * 0.04;
          const cx = cols / 2;
          const cy = rows / 2;
          const dx = c - cx;
          const dy = (r - cy) * 2.2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          // Two counter-rotating spiral arms tightening toward center
          const spiralPhase = angle - dist * 0.35 + t * 2.5;
          const arm = Math.max(0, Math.cos(spiralPhase * 2)) ** 2;
          const falloff = dist < 22 ? (1 - dist / 22) ** 0.6 : 0;
          v = arm * falloff;
          // Inner core glow
          if (dist < 3) v = Math.max(v, 0.6 + Math.random() * 0.4);
          if (v > 0) v = v * (0.75 + Math.random() * 0.25);
        }
        return v;
      };
    })(),
    [variant, active],
  );

  const { colorClass, duration } = VARIANT_STYLES[variant];

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <style>{`
        @keyframes braille-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="absolute top-0 left-0 right-0 flex items-start justify-center">
        <div
          className={`font-mono text-[16px] leading-[16px] tracking-[0.25em] whitespace-pre pt-4 bg-clip-text text-transparent bg-gradient-to-br ${colorClass}`}
          style={{
            backgroundSize: "200% 200%",
            animation: `braille-gradient-shift ${duration} ease infinite`,
          }}
        >
          {grid.map((row, i) => (
            <div key={i}>{row.join("")}</div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/90 to-background" />
    </div>
  );
}

export function ButtonBrailleBg() {
  const grid = useBrailleGrid(
    8,
    50,
    true,
    (r, c, frameCount) => {
      const x = c * 0.15;
      const y = r * 0.3;
      const t = frameCount * 0.06;

      const n1 = Math.sin(x + t);
      const n2 = Math.cos(y - t * 0.8);
      const n3 = Math.sin(x * 0.5 + y * 0.5 + t * 1.2);

      const noise = (n1 + n2 + n3) / 3;

      let v = noise * 0.5 + 0.5;
      v = v > 0.55 ? (v - 0.55) * 2.2 : 0;
      return v;
    },
    [],
  );

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.65] flex items-center justify-center"
      style={{
        maskImage:
          "radial-gradient(ellipse at center, transparent 45%, black 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, transparent 45%, black 100%)",
      }}
    >
      <div className="font-mono text-[8px] leading-[8px] tracking-[0.2em] whitespace-pre text-background">
        {grid.map((row, i) => (
          <div key={i}>{row.join("")}</div>
        ))}
      </div>
    </div>
  );
}
