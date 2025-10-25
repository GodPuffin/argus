/**
 * Monitor job queue status in real-time
 * Usage: tsx monitor-queue.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getQueueStats() {
  const { data, error } = await supabase
    .from("ai_analysis_jobs")
    .select("status, source_type, created_at, updated_at");

  if (error) {
    throw error;
  }

  const stats = {
    total: data.length,
    queued: 0,
    processing: 0,
    succeeded: 0,
    failed: 0,
    dead: 0,
    by_source: {
      vod: 0,
      live: 0,
    },
  };

  const now = Date.now();
  let oldestQueued: Date | null = null;
  let newestSucceeded: Date | null = null;

  for (const job of data) {
    stats[job.status as keyof typeof stats]++;
    stats.by_source[job.source_type as keyof typeof stats.by_source]++;

    if (job.status === "queued") {
      const created = new Date(job.created_at);
      if (!oldestQueued || created < oldestQueued) {
        oldestQueued = created;
      }
    }

    if (job.status === "succeeded") {
      const updated = new Date(job.updated_at);
      if (!newestSucceeded || updated > newestSucceeded) {
        newestSucceeded = updated;
      }
    }
  }

  const queueAge = oldestQueued
    ? Math.floor((now - oldestQueued.getTime()) / 1000)
    : 0;
  const lastProcessed = newestSucceeded
    ? Math.floor((now - newestSucceeded.getTime()) / 1000)
    : null;

  return {
    ...stats,
    queueAge,
    lastProcessed,
  };
}

async function getRecentResults() {
  const { data, error } = await supabase
    .from("ai_analysis_results")
    .select("job_id, summary, tags, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return data;
}

async function monitor() {
  console.clear();
  console.log("=".repeat(80));
  console.log("AI ANALYSIS JOB QUEUE MONITOR");
  console.log("=".repeat(80));
  console.log();

  try {
    const stats = await getQueueStats();

    console.log("Queue Status:");
    console.log(`  Total Jobs:       ${stats.total}`);
    console.log(`  ├─ Queued:        ${stats.queued}`);
    console.log(`  ├─ Processing:    ${stats.processing}`);
    console.log(`  ├─ Succeeded:     ${stats.succeeded}`);
    console.log(`  ├─ Failed:        ${stats.failed}`);
    console.log(`  └─ Dead:          ${stats.dead}`);
    console.log();

    console.log("Source Breakdown:");
    console.log(`  ├─ VOD:           ${stats.by_source.vod}`);
    console.log(`  └─ Live:          ${stats.by_source.live}`);
    console.log();

    console.log("Timing:");
    console.log(
      `  Oldest Queued:    ${stats.queueAge > 0 ? `${stats.queueAge}s ago` : "N/A"}`,
    );
    console.log(
      `  Last Processed:   ${stats.lastProcessed !== null ? `${stats.lastProcessed}s ago` : "N/A"}`,
    );
    console.log();

    if (stats.queued > 0) {
      console.log(`⚠️  ${stats.queued} jobs waiting in queue`);
      console.log();
    }

    if (stats.failed > 0 || stats.dead > 0) {
      console.log(
        `⚠️  ${stats.failed} failed jobs, ${stats.dead} dead-letter jobs`,
      );
      console.log();
    }

    // Show recent results
    const recentResults = await getRecentResults();
    if (recentResults.length > 0) {
      console.log("Recent Results:");
      for (const result of recentResults) {
        const age = Math.floor(
          (Date.now() - new Date(result.created_at).getTime()) / 1000,
        );
        console.log(
          `  [${age}s ago] Job ${result.job_id}: ${result.summary?.slice(0, 60)}...`,
        );
        if (result.tags?.length > 0) {
          console.log(`           Tags: ${result.tags.join(", ")}`);
        }
      }
      console.log();
    }

    console.log("=".repeat(80));
    console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
    console.log("Refreshing in 5 seconds... (Ctrl+C to exit)");
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

// Monitor loop
async function monitorLoop() {
  await monitor();
  setInterval(monitor, 5000);
}

monitorLoop().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

