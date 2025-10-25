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
import type { AnalysisJob, RoboflowAnalysisResponse } from "./types.js";

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
  jobId: number,
  result: {
    summary: string;
    tags: string[];
    entities: any[];
    raw: any;
  },
  detections?: RoboflowAnalysisResponse,
) {
  // Insert Gemini result
  const { error: resultError } = await supabase
    .from("ai_analysis_results")
    .upsert({
      job_id: jobId,
      summary: result.summary,
      tags: result.tags,
      entities: result.entities,
      raw: result.raw,
    });

  if (resultError) {
    console.error(`Failed to insert result for job ${jobId}:`, resultError);
  }

  // Insert object detection results
  if (detections && detections.detections.length > 0) {
    const detectionRecords = detections.detections.map((detection) => ({
      job_id: jobId,
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
        `Failed to insert detections for job ${jobId}:`,
        detectionError,
      );
    } else {
      console.log(
        `Stored ${detectionRecords.length} detection frames for job ${jobId}`,
      );
    }
  }

  // Update job status
  const { error: jobError } = await supabase
    .from("ai_analysis_jobs")
    .update({ status: "succeeded", result_ref: jobId })
    .eq("id", jobId);

  if (jobError) {
    console.error(`Failed to mark job ${jobId} as succeeded:`, jobError);
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
      await markJobSucceeded(job.id, analysisResult);
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
      await markJobSucceeded(job.id, analysisResult.value, detections);
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

