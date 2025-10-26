/**
 * Detection Queries
 * Fetch object detection data from the database
 */

import { supabase } from "@/lib/supabase";

export interface Detection {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DetectionFrame {
  frame_timestamp: number; // Absolute timestamp in video
  detections: Detection[];
}

interface Job {
  id: number;
  asset_start_seconds: number;
}

interface DetectionRecord {
  job_id: number;
  frame_timestamp: number;
  detections: Detection[];
}

/**
 * Get detections for a video source (asset ID)
 * @param sourceId - Asset ID to fetch detections for
 * @param startTime - Optional start time filter (seconds)
 * @param endTime - Optional end time filter (seconds)
 * @returns Array of detection frames with absolute timestamps
 */
export async function getDetectionsForSource(
  sourceId: string,
  startTime?: number,
  endTime?: number,
): Promise<DetectionFrame[]> {
  // Fetch all jobs for this source
  const { data: jobs, error: jobsError } = await supabase
    .from("ai_analysis_jobs")
    .select("id, start_epoch")
    .eq("source_id", sourceId)
    .eq("source_type", "vod")
    .eq("status", "succeeded");

  if (jobsError) {
    console.error("Error fetching jobs:", jobsError);
    return [];
  }

  if (!jobs || jobs.length === 0) {
    return [];
  }

  const jobIds = jobs.map((j) => j.id);

  // Fetch detections for these jobs
  const { data: detectionData, error: detectionsError } = await supabase
    .from("ai_object_detections")
    .select("job_id, frame_timestamp, detections")
    .in("job_id", jobIds)
    .order("frame_timestamp");

  if (detectionsError) {
    console.error("Error fetching detections:", detectionsError);
    return [];
  }

  if (!detectionData || detectionData.length === 0) {
    return [];
  }

  // Map job IDs to their start times for timestamp calculation
  const jobStartTimes = new Map<number, number>(
    jobs.map((j) => [j.id, j.start_epoch]),
  );

  // Convert to absolute timestamps
  const allDetections: DetectionFrame[] = [];

  for (const detection of detectionData as DetectionRecord[]) {
    const jobStartTime = jobStartTimes.get(detection.job_id);
    if (jobStartTime === undefined) continue;

    // Calculate absolute timestamp: segment start + frame offset
    const absoluteTimestamp = jobStartTime + detection.frame_timestamp;

    // Apply time range filter if provided
    if (startTime !== undefined && absoluteTimestamp < startTime) continue;
    if (endTime !== undefined && absoluteTimestamp > endTime) continue;

    allDetections.push({
      frame_timestamp: absoluteTimestamp,
      detections: detection.detections,
    });
  }

  // Ensure detections are sorted by timestamp (important when merging multiple jobs)
  allDetections.sort((a, b) => a.frame_timestamp - b.frame_timestamp);

  return allDetections;
}
