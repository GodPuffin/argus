"use client";

import { useEffect, useState } from "react";

const DEFAULT_ANIMATION_DURATION = 800;

const playedChartIds = new Set<string>();

// Clear the played-id cache on HMR so animations replay after a hot reload in dev.
declare const module: { hot?: { dispose: (cb: () => void) => void } };
if (typeof module !== "undefined" && module.hot) {
  module.hot.dispose(() => playedChartIds.clear());
}

/** Recharts series props that animate a chart only the first time it mounts. */
export interface ChartAnimationProps {
  isAnimationActive: boolean;
  animationDuration: number;
}

/**
 * Returns Recharts animation props that play once per chart `id` per session,
 * so charts animate on first reveal but not on every re-render. Spread the
 * result onto each animated series, e.g. `<Bar {...chartAnimation} />`.
 */
export function useChartAnimation(id: string): ChartAnimationProps {
  const [isAnimationActive] = useState(() => !playedChartIds.has(id));

  useEffect(() => {
    playedChartIds.add(id);
  }, [id]);

  return { isAnimationActive, animationDuration: DEFAULT_ANIMATION_DURATION };
}
