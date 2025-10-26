/**
 * Real-time stats updates hook
 * Subscribes to database changes and updates stats in real-time
 */

import { useCallback, useEffect, useState } from "react";
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
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleJobChange = useCallback(() => {
    setUpdateCount((prev) => prev + 1);
    setLastUpdate(new Date());

    // Trigger a refetch in the parent component
    if (onUpdate) {
      // Signal that jobs data needs to be refetched
      onUpdate({});
    }
  }, [onUpdate]);

  const handleDetectionChange = useCallback(() => {
    setUpdateCount((prev) => prev + 1);
    setLastUpdate(new Date());

    if (onUpdate) {
      // Signal that detection data needs to be refetched
      onUpdate({});
    }
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) {
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
        handleJobChange,
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
        handleDetectionChange,
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(detectionsChannel);
    };
  }, [enabled, handleJobChange, handleDetectionChange]);

  return {
    updateCount,
    lastUpdate,
    isActive: enabled,
  };
}
