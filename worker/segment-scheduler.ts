import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;
const SCHEDULER_INTERVAL_MS = 60000;
const WINDOW_SIZE = 60;
const LIVE_WINDOW_SIZE = 20;

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
 * Enqueue analysis windows for an asset
 * Returns the number of jobs enqueued
 */
async function enqueueAssetWindows(
  asset: MuxAsset,
  durationSeconds: number,
  liveStreamPlaybackId?: string,
): Promise<number> {
  const playbackId =
    asset.is_live && liveStreamPlaybackId
      ? liveStreamPlaybackId
      : asset.playback_ids[0]?.id;

  if (!playbackId) {
    console.warn(`Asset ${asset.id} has no playback_ids, skipping`);
    return 0;
  }

  const windowSize = asset.is_live ? LIVE_WINDOW_SIZE : WINDOW_SIZE;

  const numCompleteWindows = Math.floor(durationSeconds / windowSize);

  if (numCompleteWindows === 0) {
    console.log(
      `Asset ${asset.id} only has ${durationSeconds}s, no complete ${windowSize}s windows yet`,
    );
    return 0;
  }

  const sourceType = asset.is_live ? "live" : "vod";

  const assetStartEpoch = asset.is_live
    ? Math.floor(new Date(asset.created_at).getTime() / 1000)
    : 0;

  const jobs = [];
  for (let i = 0; i < numCompleteWindows; i++) {
    const relativeStart = i * windowSize;
    const relativeEnd = (i + 1) * windowSize;

    const startEpoch = asset.is_live
      ? assetStartEpoch + relativeStart
      : relativeStart;
    const endEpoch = asset.is_live
      ? assetStartEpoch + relativeEnd
      : relativeEnd;

    jobs.push({
      source_type: sourceType,
      source_id: asset.id,
      playback_id: playbackId,
      start_epoch: startEpoch,
      end_epoch: endEpoch,
      asset_start_seconds: relativeStart,
      asset_end_seconds: relativeEnd,
      status: "queued",
    });
  }

  const { error } = await supabase.from("ai_analysis_jobs").upsert(jobs, {
    onConflict: "source_id,asset_start_seconds,asset_end_seconds",
    ignoreDuplicates: true,
  });

  if (error) {
    console.error(`Error enqueuing jobs for asset ${asset.id}:`, error);
    return 0;
  }

  console.log(
    `Enqueued ${jobs.length} x ${windowSize}s windows for asset ${asset.id} (duration: ${durationSeconds}s, is_live: ${asset.is_live}, source_type: ${sourceType}, base_epoch: ${assetStartEpoch})`,
  );
  return jobs.length;
}

async function processAsset(asset: MuxAsset): Promise<void> {
  let durationSeconds: number;
  let liveStreamPlaybackId: string | undefined;

  if (asset.is_live) {
    const liveDuration = await fetchMuxAssetDuration(asset.id);

    if (liveDuration !== null) {
      durationSeconds = Math.floor(liveDuration);
      console.log(
        `Asset ${asset.id} (LIVE): DB duration=${asset.duration_seconds ?? 0}s, Live duration=${durationSeconds}s`,
      );
    } else {
      durationSeconds = Math.floor(asset.duration_seconds ?? 0);
      console.log(
        `Asset ${asset.id} (LIVE): Using DB duration=${durationSeconds}s (API call failed)`,
      );
    }

    if (asset.live_stream_id) {
      const { data: liveStream, error } = await supabase
        .schema("mux")
        .from("live_streams")
        .select("playback_ids")
        .eq("id", asset.live_stream_id)
        .single();

      if (!error && liveStream) {
        liveStreamPlaybackId = (liveStream as MuxLiveStream).playback_ids[0]
          ?.id;
        console.log(
          `Using live stream playback ID ${liveStreamPlaybackId} for asset ${asset.id}`,
        );
      }
    }
  } else {
    durationSeconds = Math.floor(asset.duration_seconds ?? 0);
    console.log(`Asset ${asset.id} (COMPLETED): duration=${durationSeconds}s`);
  }

  const enqueuedCount = await enqueueAssetWindows(
    asset,
    durationSeconds,
    liveStreamPlaybackId,
  );

  if (!asset.is_live) {
    const { error } = await supabase
      .schema("mux")
      .from("assets")
      .update({ ai_analysis_complete: true })
      .eq("id", asset.id);

    if (error) {
      console.error(`Error marking asset ${asset.id} as complete:`, error);
    } else {
      console.log(
        `Asset ${asset.id} marked as complete (is_live=false, ${enqueuedCount} windows enqueued, duration=${durationSeconds}s)`,
      );
    }
  }
}

async function schedulerLoop() {
  console.log("Live Asset Segment Scheduler starting...");
  console.log(
    `Config: SCHEDULER_INTERVAL=${SCHEDULER_INTERVAL_MS}ms, VOD_WINDOW=${WINDOW_SIZE}s, LIVE_WINDOW=${LIVE_WINDOW_SIZE}s`,
  );

  while (true) {
    try {
      const startTime = Date.now();

      const { data: assets, error } = await supabase
        .schema("mux")
        .from("assets")
        .select(
          "id, is_live, status, duration_seconds, playback_ids, live_stream_id, ai_analysis_complete, created_at",
        )
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
        console.log(`Processed ${assets.length} assets in ${elapsed}ms`);
      } else {
        console.log("No live-derived assets to process");
      }

      await new Promise((resolve) =>
        setTimeout(resolve, SCHEDULER_INTERVAL_MS),
      );
    } catch (error) {
      console.error("Error in scheduler loop:", error);
      await new Promise((resolve) =>
        setTimeout(resolve, SCHEDULER_INTERVAL_MS),
      );
    }
  }
}

export function startSegmentScheduler() {
  schedulerLoop().catch((error) => {
    console.error("Fatal error in segment scheduler:", error);
    process.exit(1);
  });
}
