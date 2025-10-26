/**
 * Tracking Statistics and Analytics
 * Provides aggregate statistics and insights from tracked detections
 */

import type { DetectionFrame } from "./detection-queries";
import type { Track } from "./detection-tracker";

export interface TrackingMetrics {
  totalUniquePeople: number; // Total unique tracks seen
  averageTrackDuration: number; // Average track lifetime in frames
  maxConcurrentPeople: number; // Maximum people at any one time
  totalFramesProcessed: number; // Total detection frames
}

export interface OccupancyDataPoint {
  timestamp: number; // Frame timestamp
  count: number; // Number of people at this time
}

export interface FrequentVisitor {
  trackId: string;
  appearances: number; // Number of times seen
  totalDuration: number; // Total time visible (frames)
  firstSeen: number; // First appearance frame
  lastSeen: number; // Last appearance frame
}

/**
 * Calculate tracking metrics from a set of tracks
 */
export function getTrackingMetrics(tracks: Track[]): TrackingMetrics {
  if (tracks.length === 0) {
    return {
      totalUniquePeople: 0,
      averageTrackDuration: 0,
      maxConcurrentPeople: 0,
      totalFramesProcessed: 0,
    };
  }

  const totalUniquePeople = tracks.length;
  const averageTrackDuration =
    tracks.reduce((sum, track) => sum + track.age, 0) / tracks.length;

  // For max concurrent, we'd need historical data, so we just return current count
  const maxConcurrentPeople = tracks.filter((t) => t.lostFrames === 0).length;

  // Total frames is the max age among all tracks
  const totalFramesProcessed = Math.max(...tracks.map((t) => t.age), 0);

  return {
    totalUniquePeople,
    averageTrackDuration,
    maxConcurrentPeople,
    totalFramesProcessed,
  };
}

/**
 * Build occupancy timeline from detection frames
 * Shows how many people were detected at each timestamp
 */
export function getOccupancyTimeline(
  frames: DetectionFrame[],
): OccupancyDataPoint[] {
  return frames.map((frame) => ({
    timestamp: frame.frame_timestamp,
    count: frame.detections.length,
  }));
}

/**
 * Analyze occupancy statistics
 */
export function analyzeOccupancy(timeline: OccupancyDataPoint[]): {
  averageOccupancy: number;
  maxOccupancy: number;
  minOccupancy: number;
  occupancyOverTime: OccupancyDataPoint[];
} {
  if (timeline.length === 0) {
    return {
      averageOccupancy: 0,
      maxOccupancy: 0,
      minOccupancy: 0,
      occupancyOverTime: [],
    };
  }

  const counts = timeline.map((d) => d.count);
  const averageOccupancy = counts.reduce((a, b) => a + b, 0) / counts.length;
  const maxOccupancy = Math.max(...counts);
  const minOccupancy = Math.min(...counts);

  return {
    averageOccupancy,
    maxOccupancy,
    minOccupancy,
    occupancyOverTime: timeline,
  };
}

/**
 * Detect frequent visitors based on track patterns
 * Note: This is a simplified version - in production you'd track across sessions
 */
export function detectFrequentVisitors(
  tracks: Track[],
  minAppearances: number = 1,
): FrequentVisitor[] {
  // Group tracks by patterns (simplified - just returns all tracks)
  const visitors: FrequentVisitor[] = tracks.map((track) => ({
    trackId: track.id,
    appearances: 1, // In this session
    totalDuration: track.age,
    firstSeen: 0, // Frame 0
    lastSeen: track.age,
  }));

  // Filter by minimum appearances
  return visitors.filter((v) => v.appearances >= minAppearances);
}

/**
 * Calculate dwell time distribution
 * Shows how long people typically stay in view
 */
export function getDwellTimeDistribution(tracks: Track[]): {
  bins: Array<{ range: string; count: number }>;
  averageDwellTime: number;
  medianDwellTime: number;
} {
  if (tracks.length === 0) {
    return {
      bins: [],
      averageDwellTime: 0,
      medianDwellTime: 0,
    };
  }

  const dwellTimes = tracks.map((t) => t.age).sort((a, b) => a - b);
  const averageDwellTime =
    dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
  const medianDwellTime = dwellTimes[Math.floor(dwellTimes.length / 2)];

  // Create bins: 0-5, 5-10, 10-20, 20-50, 50+ frames
  const bins = [
    { range: "0-5 frames", count: 0 },
    { range: "5-10 frames", count: 0 },
    { range: "10-20 frames", count: 0 },
    { range: "20-50 frames", count: 0 },
    { range: "50+ frames", count: 0 },
  ];

  for (const time of dwellTimes) {
    if (time < 5) bins[0].count++;
    else if (time < 10) bins[1].count++;
    else if (time < 20) bins[2].count++;
    else if (time < 50) bins[3].count++;
    else bins[4].count++;
  }

  return {
    bins,
    averageDwellTime,
    medianDwellTime,
  };
}

/**
 * Calculate peak hours/times based on detection data
 */
export function getPeakTimes(timeline: OccupancyDataPoint[]): {
  peakTimestamp: number;
  peakCount: number;
  peakPeriods: Array<{ start: number; end: number; avgCount: number }>;
} {
  if (timeline.length === 0) {
    return {
      peakTimestamp: 0,
      peakCount: 0,
      peakPeriods: [],
    };
  }

  // Find single peak
  let peakTimestamp = timeline[0].timestamp;
  let peakCount = timeline[0].count;

  for (const point of timeline) {
    if (point.count > peakCount) {
      peakCount = point.count;
      peakTimestamp = point.timestamp;
    }
  }

  // Find peak periods (consecutive high-activity periods)
  const threshold = peakCount * 0.7; // 70% of peak
  const peakPeriods: Array<{ start: number; end: number; avgCount: number }> =
    [];
  let currentPeriod: {
    start: number;
    end: number;
    sum: number;
    count: number;
  } | null = null;

  for (const point of timeline) {
    if (point.count >= threshold) {
      if (!currentPeriod) {
        currentPeriod = {
          start: point.timestamp,
          end: point.timestamp,
          sum: point.count,
          count: 1,
        };
      } else {
        currentPeriod.end = point.timestamp;
        currentPeriod.sum += point.count;
        currentPeriod.count++;
      }
    } else if (currentPeriod) {
      peakPeriods.push({
        start: currentPeriod.start,
        end: currentPeriod.end,
        avgCount: currentPeriod.sum / currentPeriod.count,
      });
      currentPeriod = null;
    }
  }

  // Add final period if exists
  if (currentPeriod) {
    peakPeriods.push({
      start: currentPeriod.start,
      end: currentPeriod.end,
      avgCount: currentPeriod.sum / currentPeriod.count,
    });
  }

  return {
    peakTimestamp,
    peakCount,
    peakPeriods,
  };
}

/**
 * Generate summary report
 */
export function generateTrackingReport(
  tracks: Track[],
  frames: DetectionFrame[],
): {
  metrics: TrackingMetrics;
  occupancy: ReturnType<typeof analyzeOccupancy>;
  dwellTime: ReturnType<typeof getDwellTimeDistribution>;
  peakTimes: ReturnType<typeof getPeakTimes>;
  frequentVisitors: FrequentVisitor[];
} {
  const timeline = getOccupancyTimeline(frames);

  return {
    metrics: getTrackingMetrics(tracks),
    occupancy: analyzeOccupancy(timeline),
    dwellTime: getDwellTimeDistribution(tracks),
    peakTimes: getPeakTimes(timeline),
    frequentVisitors: detectFrequentVisitors(tracks),
  };
}

/**
 * Format timestamp for display (seconds to MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format duration (frames to approximate time at 5 FPS)
 */
export function formatDuration(frames: number, fps: number = 5): string {
  const seconds = frames / fps;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}
