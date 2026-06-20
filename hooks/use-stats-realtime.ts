/**
 * Real-time stats updates hook
 * Subscribes to database changes and updates stats in real-time
 */

import { useCallback, useEffect, useState } from "react";
import { isDemoMode } from "@/lib/demo/flag";
import type { StatsData } from "@/lib/stats-queries";
import { supabase } from "@/lib/supabase";

interface UseStatsRealtimeOptions {
  enabled: boolean;
  onUpdate?: (stats: Partial<StatsData>) => void;
}

export function useStatsRealtime({
  enabled,
  onUpdate,
}: UseStatsRealtimeOptions) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Both subscriptions just signal the parent to refetch and stamp the time.
  const handleChange = useCallback(() => {
    setLastUpdate(new Date());
    onUpdate?.({});
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || isDemoMode) {
      return;
    }

    // Subscribe to AI analysis jobs changes
    const jobsChannel = supabase
      .channel("stats-jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_analysis_jobs",
        },
        handleChange,
      )
      .subscribe();

    // Subscribe to object detections changes
    const detectionsChannel = supabase
      .channel("stats-detections-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_object_detections",
        },
        handleChange,
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(detectionsChannel);
    };
  }, [enabled, handleChange]);

  return { lastUpdate };
}
