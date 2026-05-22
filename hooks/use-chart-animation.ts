"use client";

import { useEffect, useState } from "react";

const playedChartIds = new Set<string>();

// Clear the played-id cache on HMR so animations replay after a hot reload in dev.
declare const module: { hot?: { dispose: (cb: () => void) => void } };
if (typeof module !== "undefined" && module.hot) {
  module.hot.dispose(() => playedChartIds.clear());
}

export function useChartAnimation(id: string): boolean {
  const [animate] = useState(() => !playedChartIds.has(id));

  useEffect(() => {
    playedChartIds.add(id);
  }, [id]);

  return animate;
}
