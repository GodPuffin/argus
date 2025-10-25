/**
 * Live Asset Segment Scheduler
 * Scans mux.assets from live streams and enqueues 60s analysis windows
 * Replaces the DB cron-based segmentation approach
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;
const SCHEDULER_INTERVAL_MS = 60000; // Run every 60 seconds
const WINDOW_SIZE = 60; // 60-second analysis windows

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
}

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  throw new Error(
    "Missing required environment variables: MUX_TOKEN_ID, MUX_TOKEN_SECRET",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MuxAsset {
  id: string;
  is_live: boolean;
  status: string;
  duration_seconds: number | null;
  playback_ids: Array<{ id: string; policy: string }>;
  live_stream_id: string | null;
  ai_analysis_complete: boolean | null;
  created_at: string;
}

interface MuxLiveStream {
  id: string;
  playback_ids: Array<{ id: string; policy: string }>;
}

interface MuxApiAssetResponse {
  data: {
    id: string;
    duration?: number;
    status: string;
  };
}

/**
 * Fetch current asset duration from Mux API
 * Used for live assets where duration_seconds may be stale
 */
async function fetchMuxAssetDuration(assetId: string): Promise<number | null> {
  try {
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString(
      "base64",
    );
    const response = await fetch(
      `https://api.mux.com/video/v1/assets/${assetId}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(
        `Mux API error for asset ${assetId}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as unknown as MuxApiAssetResponse;
    return data.data.duration ?? null;
  } catch (error) {
    console.error(`Error fetching duration for asset ${assetId}:`, error);
    return null;
  }
}

/**
 * Enqueue 60s analysis windows for an asset
 * Returns the number of jobs enqueued
 */
async function enqueueAssetWindows(
  asset: MuxAsset,
  durationSeconds: number,
  liveStreamPlaybackId?: string,
): Promise<number> {
  // For live assets, use the live stream playback ID; otherwise use asset playback ID
  const playbackId = asset.is_live && liveStreamPlaybackId 
    ? liveStreamPlaybackId 
    : asset.playback_ids[0]?.id;

  if (!playbackId) {
    console.warn(`Asset ${asset.id} has no playback_ids, skipping`);
    return 0;
  }

  // Calculate complete 60s windows
  const numCompleteWindows = Math.floor(durationSeconds / WINDOW_SIZE);

  if (numCompleteWindows === 0) {
    console.log(
      `Asset ${asset.id} only has ${durationSeconds}s, no complete windows yet`,
    );
    return 0;
  }

  // Build job records for all windows
  // Use 'live' source_type for active live streams, 'vod' for completed assets
  const sourceType = asset.is_live ? "live" : "vod";
  
  // For live streams, convert relative offsets to absolute epoch timestamps
  const assetStartEpoch = asset.is_live 
    ? Math.floor(new Date(asset.created_at).getTime() / 1000)
    : 0;
  
  const jobs = [];
  for (let i = 0; i < numCompleteWindows; i++) {
    const relativeStart = i * WINDOW_SIZE;
    const relativeEnd = (i + 1) * WINDOW_SIZE;
    
    // For live: store absolute epochs; for vod: store relative seconds
    const startEpoch = asset.is_live ? assetStartEpoch + relativeStart : relativeStart;
    const endEpoch = asset.is_live ? assetStartEpoch + relativeEnd : relativeEnd;

    jobs.push({
      source_type: sourceType,
      source_id: asset.id,
      playback_id: playbackId,
      start_epoch: startEpoch,
      end_epoch: endEpoch,
      asset_start_seconds: relativeStart,  // Always relative seconds for deduplication
      asset_end_seconds: relativeEnd,
      status: "queued",
    });
  }

  // Bulk upsert - idempotent via unique index on (source_id, asset_start_seconds, asset_end_seconds)
  const { error } = await supabase
    .from("ai_analysis_jobs")
    .upsert(jobs, {
      onConflict: "source_id,asset_start_seconds,asset_end_seconds",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error(`Error enqueuing jobs for asset ${asset.id}:`, error);
    return 0;
  }

  console.log(
    `Enqueued ${jobs.length} windows for asset ${asset.id} (duration: ${durationSeconds}s, is_live: ${asset.is_live}, source_type: ${sourceType}, base_epoch: ${assetStartEpoch})`,
  );
  return jobs.length;
}

/**
 * Process a single live-derived asset
 */
async function processAsset(asset: MuxAsset): Promise<void> {
  // Determine current duration
  let durationSeconds: number;
  let liveStreamPlaybackId: string | undefined;

  if (asset.is_live) {
    // Fetch live duration from Mux API
    const liveDuration = await fetchMuxAssetDuration(asset.id);

    if (liveDuration !== null) {
      durationSeconds = Math.floor(liveDuration);
      console.log(
        `Asset ${asset.id} (LIVE): DB duration=${asset.duration_seconds ?? 0}s, Live duration=${durationSeconds}s`,
      );
    } else {
      // Fall back to DB duration if API call fails
      durationSeconds = Math.floor(asset.duration_seconds ?? 0);
      console.log(
        `Asset ${asset.id} (LIVE): Using DB duration=${durationSeconds}s (API call failed)`,
      );
    }

    // Fetch the live stream playback ID for active streams
    if (asset.live_stream_id) {
      const { data: liveStream, error } = await supabase
        .schema("mux")
        .from("live_streams")
        .select("playback_ids")
        .eq("id", asset.live_stream_id)
        .single();

      if (!error && liveStream) {
        liveStreamPlaybackId = (liveStream as MuxLiveStream).playback_ids[0]?.id;
        console.log(
          `Using live stream playback ID ${liveStreamPlaybackId} for asset ${asset.id}`,
        );
      }
    }
  } else {
    // Completed asset - use DB duration
    durationSeconds = Math.floor(asset.duration_seconds ?? 0);
    console.log(
      `Asset ${asset.id} (COMPLETED): duration=${durationSeconds}s`,
    );
  }

  // Enqueue windows
  const enqueuedCount = await enqueueAssetWindows(asset, durationSeconds, liveStreamPlaybackId);

  // Mark as complete if asset is no longer live (regardless of whether windows were enqueued)
  // This prevents re-processing short assets that never reach 60s
  if (!asset.is_live) {
    const { error } = await supabase
      .schema("mux")
      .from("assets")
      .update({ ai_analysis_complete: true })
      .eq("id", asset.id);

    if (error) {
      console.error(
        `Error marking asset ${asset.id} as complete:`,
        error,
      );
    } else {
      console.log(
        `Asset ${asset.id} marked as complete (is_live=false, ${enqueuedCount} windows enqueued, duration=${durationSeconds}s)`,
      );
    }
  }
}

/**
 * Main scheduler loop - scans and processes live-derived assets
 */
async function schedulerLoop() {
  console.log("Live Asset Segment Scheduler starting...");
  console.log(`Config: SCHEDULER_INTERVAL=${SCHEDULER_INTERVAL_MS}ms, WINDOW_SIZE=${WINDOW_SIZE}s`);

  while (true) {
    try {
      const startTime = Date.now();

      // Query assets from live streams that need processing
      const { data: assets, error } = await supabase
        .schema("mux")
        .from("assets")
        .select("id, is_live, status, duration_seconds, playback_ids, live_stream_id, ai_analysis_complete, created_at")
        .eq("status", "ready")
        .not("live_stream_id", "is", null)
        .or("ai_analysis_complete.is.null,ai_analysis_complete.eq.false");

      if (error) {
        console.error("Error querying assets:", error);
      } else if (assets && assets.length > 0) {
        console.log(`Found ${assets.length} live-derived assets to process`);

        for (const asset of assets) {
          await processAsset(asset as MuxAsset);
        }

        const elapsed = Date.now() - startTime;
        console.log(
          `Processed ${assets.length} assets in ${elapsed}ms`,
        );
      } else {
        console.log("No live-derived assets to process");
      }

      // Wait before next iteration
      await new Promise((resolve) => setTimeout(resolve, SCHEDULER_INTERVAL_MS));
    } catch (error) {
      console.error("Error in scheduler loop:", error);
      // Continue running even if one iteration fails
      await new Promise((resolve) => setTimeout(resolve, SCHEDULER_INTERVAL_MS));
    }
  }
}

/**
 * Start the scheduler (non-blocking)
 */
export function startSegmentScheduler() {
  schedulerLoop().catch((error) => {
    console.error("Fatal error in segment scheduler:", error);
    process.exit(1);
  });
}

