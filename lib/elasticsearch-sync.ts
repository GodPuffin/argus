import { bulkIndexDocuments, indexDocument } from "./elasticsearch";
import { supabase } from "./supabase";
import type {
  AnalysisDocument,
  BulkIndexDocument,
  EventDocument,
} from "./types/elasticsearch";
import { buildDocumentTitle } from "./types/elasticsearch";

// ============================================================================
// Event Syncing
// ============================================================================

/**
 * Sync a single event to Elasticsearch
 */
export async function syncEventToElasticsearch(
  eventId: string | number,
): Promise<void> {
  try {
    // Query event with joined asset data
    const { data: event, error } = await supabase
      .from("ai_analysis_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("[ES Sync] Error fetching event:", error);
      throw error;
    }

    if (!event) {
      console.warn("[ES Sync] Event not found:", eventId);
      return;
    }

    // Query asset data separately
    const { data: asset, error: assetError } = await supabase
      .schema("mux")
      .from("assets")
      .select(
        "id, playback_ids, duration_seconds, created_at, is_live, live_stream_id",
      )
      .eq("id", event.asset_id)
      .single();

    if (assetError || !asset) {
      console.warn("[ES Sync] Asset not found for event:", event.asset_id);
      return;
    }

    // Get playback ID
    const playbackIds = asset.playback_ids as any[];
    const playbackId = playbackIds?.[0]?.id;

    if (!playbackId) {
      console.warn("[ES Sync] No playback ID for asset:", asset.id);
      return;
    }

    // Query live stream if needed
    let cameraName: string | undefined;
    if (asset.live_stream_id) {
      const { data: liveStream } = await supabase
        .schema("mux")
        .from("live_streams")
        .select("camera_name")
        .eq("id", asset.live_stream_id)
        .single();

      cameraName = liveStream?.camera_name;
    }

    // Determine asset type based on presence of live_stream_id
    const assetType: "live" | "vod" = asset.live_stream_id ? "live" : "vod";

    // Build the document
    const document: EventDocument = {
      doc_type: "event",
      asset_id: event.asset_id,
      asset_type: assetType,
      camera_name: cameraName,
      title: buildDocumentTitle(assetType, cameraName, asset.created_at),
      description: event.description,
      severity: event.severity,
      event_type: event.type,
      timestamp_seconds: event.timestamp_seconds,
      affected_entities: event.affected_entities || [],
      tags: [], // Events don't have tags, but we keep the field for consistency
      created_at: asset.created_at,
      playback_id: playbackId,
      duration: asset.duration_seconds
        ? Math.floor(asset.duration_seconds)
        : undefined,
    };

    // Index the document
    const docId = `event_${event.id}`;
    await indexDocument(docId, document);

    console.log(`[ES Sync] Event synced: ${docId}`);
  } catch (error) {
    console.error("[ES Sync] Failed to sync event:", eventId, error);
    throw error;
  }
}

/**
 * Bulk sync all events to Elasticsearch
 */
export async function bulkSyncEvents(): Promise<number> {
  try {
    console.log("[ES Sync] Starting bulk event sync...");

    // Query all events
    const { data: events, error } = await supabase
      .from("ai_analysis_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ES Sync] Error fetching events:", error);
      throw error;
    }

    if (!events || events.length === 0) {
      console.log("[ES Sync] No events to sync");
      return 0;
    }

    // Get unique asset IDs
    const assetIds = [...new Set(events.map((e) => e.asset_id))];

    // Query all assets
    const { data: assets, error: assetsError } = await supabase
      .schema("mux")
      .from("assets")
      .select(
        "id, playback_ids, duration_seconds, created_at, is_live, live_stream_id",
      )
      .in("id", assetIds);

    if (assetsError) {
      console.error("[ES Sync] Error fetching assets:", assetsError);
      throw assetsError;
    }

    // Create asset lookup map
    const assetMap = new Map(assets?.map((a) => [a.id, a]) || []);

    // Get unique live stream IDs
    const liveStreamIds = [
      ...new Set(
        assets
          ?.filter((a) => a.live_stream_id)
          .map((a) => a.live_stream_id as string) || [],
      ),
    ];

    // Query all live streams
    const { data: liveStreams } = await supabase
      .schema("mux")
      .from("live_streams")
      .select("id, camera_name")
      .in("id", liveStreamIds);

    // Create live stream lookup map
    const liveStreamMap = new Map(liveStreams?.map((ls) => [ls.id, ls]) || []);

    // Build documents
    const documents: BulkIndexDocument[] = events
      .filter((event) => {
        const asset = assetMap.get(event.asset_id);
        return asset && (asset as any).playback_ids?.[0]?.id;
      })
      .map((event) => {
        const asset = assetMap.get(event.asset_id) as any;
        const liveStream = asset.live_stream_id
          ? liveStreamMap.get(asset.live_stream_id)
          : null;
        const playbackIds = asset.playback_ids as any[];
        const playbackId = playbackIds[0].id;
        const assetType: "live" | "vod" = asset.live_stream_id ? "live" : "vod";
        const cameraName = liveStream?.camera_name;

        const document: EventDocument = {
          doc_type: "event",
          asset_id: event.asset_id,
          asset_type: assetType,
          camera_name: cameraName,
          title: buildDocumentTitle(assetType, cameraName, asset.created_at),
          description: event.description,
          severity: event.severity,
          event_type: event.type,
          timestamp_seconds: event.timestamp_seconds,
          affected_entities: event.affected_entities || [],
          tags: [],
          created_at: asset.created_at,
          playback_id: playbackId,
          duration: asset.duration_seconds
            ? Math.floor(asset.duration_seconds)
            : undefined,
        };

        return {
          id: `event_${event.id}`,
          document,
        };
      });

    // Bulk index
    await bulkIndexDocuments(documents);

    console.log(`[ES Sync] Bulk synced ${documents.length} events`);
    return documents.length;
  } catch (error) {
    console.error("[ES Sync] Failed to bulk sync events:", error);
    throw error;
  }
}

// ============================================================================
// Analysis Syncing
// ============================================================================

/**
 * Sync a single analysis result to Elasticsearch
 */
export async function syncAnalysisToElasticsearch(
  jobId: string | number,
): Promise<void> {
  try {
    // Query analysis result
    const { data: result, error } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .eq("job_id", jobId)
      .single();

    if (error) {
      console.error("[ES Sync] Error fetching analysis result:", error);
      throw error;
    }

    if (!result) {
      console.warn("[ES Sync] Analysis result not found:", jobId);
      return;
    }

    // Query job data
    const { data: job, error: jobError } = await supabase
      .from("ai_analysis_jobs")
      .select(
        "id, source_id, source_type, asset_start_seconds, asset_end_seconds",
      )
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.warn("[ES Sync] Job not found:", jobId);
      return;
    }

    // Query asset data
    const { data: asset, error: assetError } = await supabase
      .schema("mux")
      .from("assets")
      .select(
        "id, playback_ids, duration_seconds, created_at, is_live, live_stream_id",
      )
      .eq("id", job.source_id)
      .single();

    if (assetError || !asset) {
      console.warn("[ES Sync] Asset not found for job:", job.source_id);
      return;
    }

    // Get playback ID
    const playbackIds = asset.playback_ids as any[];
    const playbackId = playbackIds?.[0]?.id;

    if (!playbackId) {
      console.warn("[ES Sync] No playback ID for asset:", asset.id);
      return;
    }

    // Query live stream if needed
    let cameraName: string | undefined;
    if (asset.live_stream_id) {
      const { data: liveStream } = await supabase
        .schema("mux")
        .from("live_streams")
        .select("camera_name")
        .eq("id", asset.live_stream_id)
        .single();

      cameraName = liveStream?.camera_name;
    }

    // Determine asset type based on presence of live_stream_id
    const assetType: "live" | "vod" = asset.live_stream_id ? "live" : "vod";

    // Build the document
    const document: AnalysisDocument = {
      doc_type: "analysis",
      asset_id: job.source_id,
      asset_type: assetType,
      camera_name: cameraName,
      title: buildDocumentTitle(
        assetType,
        cameraName,
        (asset as any).created_at,
      ),
      summary: result.summary || "",
      tags: result.tags || [],
      entities: result.entities || [],
      asset_start_seconds: job.asset_start_seconds || 0,
      asset_end_seconds: job.asset_end_seconds || 60,
      created_at: (asset as any).created_at,
      playback_id: playbackId,
      duration: (asset as any).duration_seconds
        ? Math.floor((asset as any).duration_seconds)
        : undefined,
    };

    // Index the document
    const docId = `analysis_${result.job_id}`;
    await indexDocument(docId, document);

    console.log(`[ES Sync] Analysis synced: ${docId}`);
  } catch (error) {
    console.error("[ES Sync] Failed to sync analysis:", jobId, error);
    throw error;
  }
}

/**
 * Bulk sync all analysis results to Elasticsearch
 */
export async function bulkSyncAnalysis(): Promise<number> {
  try {
    console.log("[ES Sync] Starting bulk analysis sync...");

    // Query all analysis results
    const { data: results, error } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ES Sync] Error fetching analysis results:", error);
      throw error;
    }

    if (!results || results.length === 0) {
      console.log("[ES Sync] No analysis results to sync");
      return 0;
    }

    // Query all jobs
    const jobIds = results.map((r) => r.job_id);
    const { data: jobs, error: jobsError } = await supabase
      .from("ai_analysis_jobs")
      .select(
        "id, source_id, source_type, asset_start_seconds, asset_end_seconds",
      )
      .in("id", jobIds);

    if (jobsError) {
      console.error("[ES Sync] Error fetching jobs:", jobsError);
      throw jobsError;
    }

    // Create job lookup map
    const jobMap = new Map(jobs?.map((j) => [j.id, j]) || []);

    // Get unique asset IDs
    const assetIds = [
      ...new Set(jobs?.map((j) => j.source_id).filter(Boolean) || []),
    ];

    // Query all assets
    const { data: assets, error: assetsError } = await supabase
      .schema("mux")
      .from("assets")
      .select(
        "id, playback_ids, duration_seconds, created_at, is_live, live_stream_id",
      )
      .in("id", assetIds);

    if (assetsError) {
      console.error("[ES Sync] Error fetching assets:", assetsError);
      throw assetsError;
    }

    // Create asset lookup map
    const assetMap = new Map(assets?.map((a) => [a.id, a]) || []);

    // Get unique live stream IDs
    const liveStreamIds = [
      ...new Set(
        assets
          ?.filter((a) => a.live_stream_id)
          .map((a) => a.live_stream_id as string) || [],
      ),
    ];

    // Query all live streams
    const { data: liveStreams } = await supabase
      .schema("mux")
      .from("live_streams")
      .select("id, camera_name")
      .in("id", liveStreamIds);

    // Create live stream lookup map
    const liveStreamMap = new Map(liveStreams?.map((ls) => [ls.id, ls]) || []);

    // Build documents
    const documents: BulkIndexDocument[] = results
      .filter((result) => {
        const job = jobMap.get(result.job_id);
        const asset = job ? assetMap.get(job.source_id) : null;
        return asset && (asset as any).playback_ids?.[0]?.id;
      })
      .map((result) => {
        const job = jobMap.get(result.job_id)!;
        const asset = assetMap.get(job.source_id) as any;
        const liveStream = asset.live_stream_id
          ? liveStreamMap.get(asset.live_stream_id)
          : null;
        const playbackIds = asset.playback_ids as any[];
        const playbackId = playbackIds[0].id;
        const assetType: "live" | "vod" = asset.live_stream_id ? "live" : "vod";
        const cameraName = liveStream?.camera_name;

        const document: AnalysisDocument = {
          doc_type: "analysis",
          asset_id: job.source_id,
          asset_type: assetType,
          camera_name: cameraName,
          title: buildDocumentTitle(assetType, cameraName, asset.created_at),
          summary: result.summary || "",
          tags: result.tags || [],
          entities: result.entities || [],
          asset_start_seconds: job.asset_start_seconds || 0,
          asset_end_seconds: job.asset_end_seconds || 60,
          created_at: asset.created_at,
          playback_id: playbackId,
          duration: asset.duration_seconds
            ? Math.floor(asset.duration_seconds)
            : undefined,
        };

        return {
          id: `analysis_${result.job_id}`,
          document,
        };
      });

    // Bulk index
    await bulkIndexDocuments(documents);

    console.log(`[ES Sync] Bulk synced ${documents.length} analysis results`);
    return documents.length;
  } catch (error) {
    console.error("[ES Sync] Failed to bulk sync analysis:", error);
    throw error;
  }
}

// ============================================================================
// Combined Syncing
// ============================================================================

/**
 * Sync all events and analysis results to Elasticsearch
 */
export async function syncAllToElasticsearch(): Promise<{
  events: number;
  analysis: number;
}> {
  console.log("[ES Sync] Starting full sync...");

  const eventCount = await bulkSyncEvents();
  const analysisCount = await bulkSyncAnalysis();

  console.log(
    `[ES Sync] Full sync complete: ${eventCount} events, ${analysisCount} analysis results`,
  );

  return {
    events: eventCount,
    analysis: analysisCount,
  };
}
