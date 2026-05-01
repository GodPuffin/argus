"use client";

import { useEffect, useState } from "react";

const playedChartIds = new Set<string>();

export function useChartAnimation(id: string): boolean {
  const [animate] = useState(() => !playedChartIds.has(id));

  useEffect(() => {
    playedChartIds.add(id);
  }, [id]);

  return animate;
}
