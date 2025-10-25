import { useState, useEffect } from "react";
import type { DetectionFrame } from "@/lib/detection-queries";

interface UseDetectionsOptions {
  enabled?: boolean;
  startTime?: number;
  endTime?: number;
}

interface UseDetectionsResult {
  detections: DetectionFrame[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch object detections for a video source
 * @param sourceId - Asset ID to fetch detections for
 * @param options - Configuration options
 * @returns Detection data, loading state, and error state
 */
export function useDetections(
  sourceId: string | null,
  options: UseDetectionsOptions = {},
): UseDetectionsResult {
  const { enabled = true, startTime, endTime } = options;
  const [detections, setDetections] = useState<DetectionFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceId || !enabled) {
      setDetections([]);
      return;
    }

    const fetchDetections = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ sourceId });
        if (startTime !== undefined) params.append("startTime", startTime.toString());
        if (endTime !== undefined) params.append("endTime", endTime.toString());

        const response = await fetch(`/api/detections?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch detections: ${response.statusText}`);
        }

        const data = await response.json();
        setDetections(data.detections || []);
      } catch (err) {
        console.error("Error fetching detections:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchDetections();
  }, [sourceId, enabled, startTime, endTime]);

  return { detections, loading, error };
}

