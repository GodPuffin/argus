import { queueWorkflowsForEvent } from "@mux/supabase";
import { MuxSync } from "@mux/sync-engine";
import { createClient } from "@supabase/supabase-js";

// Load secrets from environment variables
const databaseUrl =
  Deno.env.get("SUPABASE_DB_URL") || "postgresql://your-database-url";
const muxWebhookSecret =
  Deno.env.get("MUX_WEBHOOK_SECRET") || "your-mux-webhook-secret";
const muxTokenId = Deno.env.get("MUX_TOKEN_ID") || "your-mux-token-id";
const muxTokenSecret =
  Deno.env.get("MUX_TOKEN_SECRET") || "your-mux-token-secret";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize MuxSync
const muxSync = new MuxSync({
  databaseUrl,
  muxWebhookSecret,
  muxTokenId,
  muxTokenSecret,
  backfillRelatedEntities: false,
  revalidateEntityViaMuxApi: true,
  maxPostgresConnections: 5,
  logger: console,
});

// Initialize Supabase client for AI job enqueuing
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Enqueue AI analysis jobs for a VOD asset
 * Splits the asset duration into 60-second windows
 */
async function enqueueVodJobs(
  assetId: string,
  playbackId: string,
  durationSeconds: number,
) {
  const jobs = [];
  const windowSize = 60; // seconds

  // Calculate number of complete 60s windows
  const numWindows = Math.ceil(durationSeconds / windowSize);

  for (let i = 0; i < numWindows; i++) {
    const startTime = i * windowSize;
    const endTime = Math.min((i + 1) * windowSize, durationSeconds);

    // Use epoch=0 as base, store relative times as epoch for consistency
    // Worker will use asset_start_time/asset_end_time for VOD
    // Round to integers since database expects bigint
    jobs.push({
      source_type: "vod",
      source_id: assetId,
      playback_id: playbackId,
      start_epoch: Math.floor(startTime),
      end_epoch: Math.ceil(endTime),
      asset_start_seconds: Math.floor(startTime), // For deduplication
      asset_end_seconds: Math.ceil(endTime),
      status: "queued",
    });
  }

  if (jobs.length > 0) {
    const { error } = await supabase.from("ai_analysis_jobs").upsert(jobs, {
      onConflict: "source_id,asset_start_seconds,asset_end_seconds",
      ignoreDuplicates: true,
    });

    if (error) {
      console.error("Error enqueuing VOD jobs:", error);
    } else {
      console.log(`Enqueued ${jobs.length} analysis jobs for asset ${assetId}`);
    }
  }
}

// Create HTTP server handler
Deno.serve(async (req) => {
  // Only handle POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const webhookData = JSON.parse(body);

    // Process through MuxSync first
    await muxSync.processWebhook(
      body,
      Object.fromEntries(req.headers.entries()),
    );
    await queueWorkflowsForEvent(
      body,
      Object.fromEntries(req.headers.entries()),
    );

    // Handle AI analysis job enqueuing based on event type
    const eventType = webhookData.type;
    const data = webhookData.data;

    if (eventType === "video.asset.ready") {
      // VOD asset is ready - enqueue minute-by-minute jobs
      // BUT: Skip ALL live-derived assets - the worker scheduler handles them
      const assetId = data.id;
      const duration = data.duration || 0;
      const playbackIds = data.playback_ids || [];
      const playbackId = playbackIds[0]?.id;
      const hasLiveStreamId = !!data.live_stream_id;

      if (hasLiveStreamId) {
        // Asset from live stream - let worker scheduler handle segmentation
        console.log(
          `Asset ${assetId} is from a live stream, skipping webhook enqueue. Worker scheduler will handle segmentation.`,
        );
      } else if (playbackId && duration > 0) {
        // Regular VOD upload (not from a live stream) - enqueue immediately
        console.log(
          `Enqueuing VOD jobs for regular asset ${assetId} (duration: ${duration}s)`,
        );
        await enqueueVodJobs(assetId, playbackId, duration);
      } else {
        console.warn(
          `Asset ${assetId} ready but missing playback_id or duration`,
        );
      }
    }

    if (eventType === "video.asset.live_stream_completed") {
      // Live stream has ended - enqueue ALL segments (complete windows + tail)
      // This ensures we don't miss any windows if stream ended between scheduler runs
      const assetId = data.id;
      const duration = data.duration || 0;
      const playbackIds = data.playback_ids || [];
      const playbackId = playbackIds[0]?.id;
      const windowSize = 60;

      if (!playbackId || duration === 0) {
        console.log(
          `Asset ${assetId} completed but missing playback_id or duration`,
        );
        return new Response(JSON.stringify({ status: "success" }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(
        `Live stream ${assetId} completed with duration ${duration}s - enqueueing all segments`,
      );

      // Build ALL jobs: complete 60s windows + tail (if any)
      const jobs = [];
      const numCompleteWindows = Math.floor(duration / windowSize);

      // Enqueue all complete 60s windows
      for (let i = 0; i < numCompleteWindows; i++) {
        const windowStart = i * windowSize;
        const windowEnd = (i + 1) * windowSize;

        jobs.push({
          source_type: "vod",
          source_id: assetId,
          playback_id: playbackId,
          start_epoch: windowStart,
          end_epoch: windowEnd,
          asset_start_seconds: windowStart, // For deduplication
          asset_end_seconds: windowEnd,
          status: "queued",
        });
      }

      // Enqueue tail segment if there's a partial window
      const remainingSeconds = duration - numCompleteWindows * windowSize;
      if (remainingSeconds > 0) {
        const tailStart = numCompleteWindows * windowSize;
        const tailEnd = duration;

        jobs.push({
          source_type: "vod",
          source_id: assetId,
          playback_id: playbackId,
          start_epoch: Math.floor(tailStart),
          end_epoch: Math.ceil(tailEnd),
          asset_start_seconds: Math.floor(tailStart), // For deduplication
          asset_end_seconds: Math.ceil(tailEnd),
          status: "queued",
        });
      }

      if (jobs.length > 0) {
        const { error } = await supabase.from("ai_analysis_jobs").upsert(jobs, {
          onConflict: "source_id,asset_start_seconds,asset_end_seconds",
          ignoreDuplicates: true,
        });

        if (error) {
          console.error(
            `Error enqueueing segments for completed stream ${assetId}:`,
            error,
          );
        } else {
          console.log(
            `Enqueued ${jobs.length} segments for completed stream ${assetId} (${numCompleteWindows} complete windows + ${remainingSeconds > 0 ? 1 : 0} tail)`,
          );
        }
      }
    }

    return new Response(JSON.stringify({ status: "success" }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
