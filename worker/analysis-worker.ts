/**
 * AI Analysis Worker
 * Dequeues jobs, fetches video segments via Mux instant clipping,
 * processes with Gemini, and persists results
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchAndTransmuxSegment } from "./ffmpeg-transmux.js";
import { analyzeVideoWithGemini } from "./gemini-client.js";
import { analyzeVideoWithRoboflow } from "./roboflow-detector.js";
import { startSegmentScheduler } from "./segment-scheduler.js";
import type { AnalysisJob, RoboflowAnalysisResponse, Entity, Event as AnalysisEvent } from "./types.js";

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const MAX_CONCURRENT_JOBS = 3;
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 10000; // 10 seconds base

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Base URL for the application API (for syncing to Elasticsearch)
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Sync event to Elasticsearch
 */
async function syncEventToElasticsearch(eventId: number) {
  try {
    const url = `${APP_BASE_URL}/api/search/sync?type=event&id=${eventId}`;
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      console.warn(`Failed to sync event ${eventId} to Elasticsearch:`, await response.text());
    } else {
      console.log(`Synced event ${eventId} to Elasticsearch`);
    }
  } catch (error) {
    console.warn(`Failed to sync event ${eventId} to Elasticsearch:`, error);
    // Don't throw - syncing is best-effort
  }
}

/**
 * Sync analysis result to Elasticsearch
 */
async function syncAnalysisToElasticsearch(jobId: number) {
  try {
    const url = `${APP_BASE_URL}/api/search/sync?type=analysis&id=${jobId}`;
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      console.warn(`Failed to sync analysis ${jobId} to Elasticsearch:`, await response.text());
    } else {
      console.log(`Synced analysis ${jobId} to Elasticsearch`);
    }
  } catch (error) {
    console.warn(`Failed to sync analysis ${jobId} to Elasticsearch:`, error);
    // Don't throw - syncing is best-effort
  }
}

/**
 * Dequeue the next available job (FIFO)
 */
async function dequeueJob(): Promise<AnalysisJob | null> {
  const { data, error } = await supabase
    .from("ai_analysis_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // Atomically mark as processing
  const { data: updated, error: updateError } = await supabase
    .from("ai_analysis_jobs")
    .update({ status: "processing" })
    .eq("id", data.id)
    .eq("status", "queued") // Ensure it's still queued
    .select()
    .single();

  if (updateError || !updated) {
    // Another worker grabbed it
    return null;
  }

  return updated as AnalysisJob;
}

/**
 * Mark job as succeeded and store results
 */
async function markJobSucceeded(
  job: AnalysisJob,
  result: import("./types.js").GeminiAnalysisResponse,
  detections?: RoboflowAnalysisResponse,
) {
  // Insert Gemini result
  const { error: resultError } = await supabase
    .from("ai_analysis_results")
    .upsert({
      job_id: job.id,
      summary: result.summary,
      tags: result.tags,
      entities: result.entities,
      raw: result.raw,
    });

  if (resultError) {
    console.error(`Failed to insert result for job ${job.id}:`, resultError);
  } else {
    // Sync analysis result to Elasticsearch (best-effort, non-blocking)
    syncAnalysisToElasticsearch(job.id).catch(err => 
      console.warn(`Elasticsearch sync error for analysis ${job.id}:`, err)
    );
  }

  // Insert events into dedicated events table
  if (result.events && result.events.length > 0) {
    // Resolve the actual asset_id
    // For VOD jobs: source_id is already the asset_id
    // For live jobs: need to lookup the live stream's active_asset_id
    let assetId = job.source_id;
    
    if (job.source_type === "live") {
      const { data: liveStream, error: liveStreamError } = await supabase
        .schema("mux")
        .from("live_streams")
        .select("active_asset_id")
        .eq("id", job.source_id)
        .single();

      if (liveStreamError || !liveStream?.active_asset_id) {
        console.warn(
          `Could not resolve active_asset_id for live stream ${job.source_id}, skipping events`,
        );
        // Skip events if we can't resolve the asset_id
        // (this shouldn't happen normally as live streams should have active_asset_id)
      } else {
        assetId = liveStream.active_asset_id;
      }
    }

    // Only insert events if we have a valid asset_id
    if (assetId) {
      const eventRecords = result.events.map((event: any) => {
        // Calculate absolute timestamp from asset start
        // job.asset_start_seconds contains the absolute position of this clip in the asset
        // event.timestamp_seconds is relative to the clip start (0-60)
        const absoluteTimestamp = (job.asset_start_seconds || 0) + event.timestamp_seconds;

        // Map affected entity IDs to actual entity objects for denormalization
        let affectedEntities: any[] = [];
        if (event.affected_entity_ids && event.affected_entity_ids.length > 0) {
          affectedEntities = event.affected_entity_ids
            .map((id: number) => result.entities[id])
            .filter((entity: any) => entity !== undefined);
        }

        return {
          job_id: job.id,
          asset_id: assetId,
          name: event.name,
          description: event.description,
          severity: event.severity,
          type: event.type,
          timestamp_seconds: absoluteTimestamp,
          affected_entities: affectedEntities,
        };
      });

      const { data: insertedEvents, error: eventsError } = await supabase
        .from("ai_analysis_events")
        .insert(eventRecords)
        .select('id');

      if (eventsError) {
        console.error(`Failed to insert events for job ${job.id}:`, eventsError);
      } else {
        console.log(`Inserted ${eventRecords.length} events for asset ${assetId} (job ${job.id})`);
        
        // Sync each event to Elasticsearch (best-effort, non-blocking)
        if (insertedEvents && insertedEvents.length > 0) {
          for (const event of insertedEvents) {
            syncEventToElasticsearch(event.id).catch(err =>
              console.warn(`Elasticsearch sync error for event ${event.id}:`, err)
            );
          }
        }
      }
    }
  }

  // Insert object detection results
  if (detections && detections.detections.length > 0) {
    const detectionRecords = detections.detections.map((detection) => ({
      job_id: job.id,
      frame_timestamp: detection.frame_timestamp,
      frame_index: detection.frame_index,
      detections: detection.detections,
    }));

    const { error: detectionError } = await supabase
      .from("ai_object_detections")
      .upsert(detectionRecords, {
        onConflict: "job_id,frame_timestamp",
        ignoreDuplicates: true,
      });

    if (detectionError) {
      console.error(
        `Failed to insert detections for job ${job.id}:`,
        detectionError,
      );
    } else {
      console.log(
        `Stored ${detectionRecords.length} detection frames for job ${job.id}`,
      );
    }
  }

  // Update job status
  const { error: jobError } = await supabase
    .from("ai_analysis_jobs")
    .update({ status: "succeeded", result_ref: job.id })
    .eq("id", job.id);

  if (jobError) {
    console.error(`Failed to mark job ${job.id} as succeeded:`, jobError);
  }
}

/**
 * Mark job as failed with retry or dead-letter
 */
async function markJobFailed(jobId: number, attempts: number, error: string) {
  const newAttempts = attempts + 1;
  const status = newAttempts >= MAX_ATTEMPTS ? "dead" : "failed";

  const { error: updateError } = await supabase
    .from("ai_analysis_jobs")
    .update({ status, attempts: newAttempts, error })
    .eq("id", jobId);

  if (updateError) {
    console.error(`Failed to update job ${jobId} status:`, updateError);
  }

  if (status === "dead") {
    console.error(`Job ${jobId} moved to dead-letter queue after ${newAttempts} attempts`);
  }
}

/**
 * Retry failed jobs with exponential backoff
 */
async function retryFailedJobs() {
  const { data: failedJobs, error } = await supabase
    .from("ai_analysis_jobs")
    .select("*")
    .eq("status", "failed")
    .lt("attempts", MAX_ATTEMPTS);

  if (error || !failedJobs || failedJobs.length === 0) {
    return;
  }

  for (const job of failedJobs) {
    const backoffMs = BACKOFF_BASE_MS * 2 ** job.attempts;
    const elapsedMs = Date.now() - new Date(job.updated_at).getTime();

    if (elapsedMs >= backoffMs) {
      // Reset to queued for retry
      await supabase
        .from("ai_analysis_jobs")
        .update({ status: "queued" })
        .eq("id", job.id);

      console.log(`Retrying job ${job.id} (attempt ${job.attempts + 1})`);
    }
  }
}

/**
 * Process a single job
 */
async function processJob(job: AnalysisJob) {
  console.log(
    `Processing job ${job.id}: ${job.source_type} ${job.source_id} [${job.start_epoch}, ${job.end_epoch})`,
  );

  try {
    // Build Mux URL with clipping parameters
    // Note: Most assets use PUBLIC playback policy and don't require signing
    // If signing is needed, the key ID/secret must be configured
    let playbackUrl: string;

    if (job.source_type === "live") {
      // Active live stream – use ABSOLUTE epoch params: program_start_time / program_end_time
      const params = new URLSearchParams({
        program_start_time: job.start_epoch.toString(),
        program_end_time: job.end_epoch.toString(),
      });
      playbackUrl = `https://stream.mux.com/${job.playback_id}.m3u8?${params.toString()}`;
    } else {
      // Completed VOD asset – use RELATIVE clipping params: asset_start_time / asset_end_time
      const params = new URLSearchParams({
        asset_start_time: job.start_epoch.toString(),
        asset_end_time: job.end_epoch.toString(),
      });
      playbackUrl = `https://stream.mux.com/${job.playback_id}.m3u8?${params.toString()}`;
    }

    // Fetch HLS and transmux to MP4
    const mp4Buffer = await fetchAndTransmuxSegment(playbackUrl);

    console.log(`Segment ready: ${(mp4Buffer.length / 1024 / 1024).toFixed(1)}MB`);

    // Calculate timestamp offset for this segment
    const segmentStartTime = job.source_type === "vod" 
      ? job.start_epoch  // VOD uses relative seconds
      : 0;  // LIVE clips are already timestamped from stream start

    // Run analysis based on source type
    if (job.source_type === "live") {
      // LIVE: Gemini only
      console.log(`LIVE job: Running Gemini analysis only`);
      const analysisResult = await analyzeVideoWithGemini(mp4Buffer);
      console.log(`Analysis complete for job ${job.id} (LIVE)`);
      await markJobSucceeded(job, analysisResult);
    } else {
      // VOD: Gemini + Roboflow in parallel
      console.log(`VOD job: Running Gemini + Roboflow analysis`);
      const [analysisResult, detectionResult] = await Promise.allSettled([
        analyzeVideoWithGemini(mp4Buffer),
        analyzeVideoWithRoboflow(mp4Buffer, segmentStartTime),
      ]);

      // Check Gemini result
      if (analysisResult.status === "rejected") {
        throw new Error(`Gemini analysis failed: ${analysisResult.reason}`);
      }

      // Log Roboflow result (don't fail job if it fails)
      let detections: RoboflowAnalysisResponse | undefined;
      if (detectionResult.status === "fulfilled") {
        detections = detectionResult.value;
        console.log(
          `Roboflow detected ${detections.totalDetections} people in ${detections.totalFrames} frames`,
        );
      } else {
        console.warn(
          `Roboflow detection failed (job will still succeed): ${detectionResult.reason}`,
        );
      }

      console.log(`Analysis complete for job ${job.id} (VOD)`);
      await markJobSucceeded(job, analysisResult.value, detections);
    }

    console.log(`Job ${job.id} succeeded`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Job ${job.id} failed:`, errorMessage);

    await markJobFailed(job.id, job.attempts, errorMessage);
  }
}

/**
 * Worker main loop
 */
async function workerLoop() {
  console.log("AI Analysis Worker starting...");
  console.log(
    `Config: POLL_INTERVAL=${POLL_INTERVAL_MS}ms, MAX_CONCURRENT=${MAX_CONCURRENT_JOBS}, MAX_ATTEMPTS=${MAX_ATTEMPTS}`,
  );

  const activeJobs: Set<Promise<void>> = new Set();

  while (true) {
    try {
      // Retry failed jobs periodically
      await retryFailedJobs();

      // Dequeue jobs up to concurrency limit
      while (activeJobs.size < MAX_CONCURRENT_JOBS) {
        const job = await dequeueJob();

        if (!job) {
          break; // No jobs available
        }

        // Process job asynchronously
        const jobPromise = processJob(job).finally(() => {
          activeJobs.delete(jobPromise);
        });

        activeJobs.add(jobPromise);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      console.error("Error in worker loop:", error);
      // Continue running even if one iteration fails
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down worker...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down worker...");
  process.exit(0);
});

// Start segment scheduler (non-blocking)
startSegmentScheduler();

// Start worker
workerLoop().catch((error) => {
  console.error("Fatal error in worker:", error);
  process.exit(1);
});

