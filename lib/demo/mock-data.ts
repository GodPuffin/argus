/**
 * Argus Demo Mock Data
 *
 * Central fixture module used whenever DEMO_MODE=true. All API routes that
 * would normally hit Supabase/Mux/Elasticsearch return slices of this data.
 *
 * Timestamps are computed relative to `now()` at module load so deploys feel
 * fresh, but stay consistent across a single process / request tree.
 */

import type {
  AIAnalysisEvent,
  AIAnalysisJob,
  AIAnalysisResult,
  Asset,
  Camera,
  Report,
} from "@/lib/supabase";

const NOW = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const isoAt = (msAgo: number) => new Date(NOW - msAgo).toISOString();

// Public Mux demo playback IDs (Mux publishes these as sample content). Shared
// with the demo-session store so session-added cameras render live tiles too.
export const PUBLIC_PLAYBACKS = [
  "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe",
  "qxb01i6T202018GFS02vp9RIe01icTcDCjVzQpmaB00CUisJ4",
  "VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU",
  "OZpQKVuPJhKyp9cAMuAx63GVAjtDLfLuurGLCSx01oxgI",
];

// Deterministic 0–99 pseudo-random value from an index, used to vary fixtures
// without pulling in real randomness (so renders stay stable).
const pseudoRandom = (i: number) => (i * 37) % 100;

// First IDs for the demo event / job sequences (kept clear of real-data ranges).
const EVENT_ID_BASE = 1000;
const JOB_ID_BASE = 500;

// ────────────────────────────────────────────────────────────────────────
// Cameras
// ────────────────────────────────────────────────────────────────────────

const CAMERA_DEFS: Array<{
  name: string;
  status: Camera["status"];
  lastMsAgo: number | null;
}> = [
  { name: "Lobby North", status: "active", lastMsAgo: 2 * 60 * 1000 },
  { name: "Parking Lot A", status: "active", lastMsAgo: 45 * 1000 },
  { name: "Loading Dock", status: "idle", lastMsAgo: 4 * HOUR },
  { name: "Server Room", status: "active", lastMsAgo: 10 * 60 * 1000 },
  { name: "Rear Entrance", status: "idle", lastMsAgo: 12 * HOUR },
  { name: "Reception", status: "active", lastMsAgo: 30 * 1000 },
  { name: "Warehouse West", status: "active", lastMsAgo: 5 * 60 * 1000 },
  { name: "Rooftop", status: "disabled", lastMsAgo: 3 * DAY },
];

export const mockCameras: Camera[] = CAMERA_DEFS.map((c, i) => ({
  id: `demo-cam-${String(i + 1).padStart(3, "0")}`,
  browser_id: `demo-browser-${i + 1}`,
  camera_name: c.name,
  stream_key: `demo-key-${i + 1}-xxxx-xxxx`,
  playback_ids: [
    { id: PUBLIC_PLAYBACKS[i % PUBLIC_PLAYBACKS.length], policy: "public" },
  ],
  status: c.status,
  created_at: isoAt((7 + i) * DAY),
  last_connected_at: c.lastMsAgo === null ? null : isoAt(c.lastMsAgo),
  active_asset_id: c.status === "active" ? `demo-asset-${i + 1}` : null,
  recent_asset_ids: [`demo-asset-${i + 1}`, `demo-asset-${i + 1}-b`],
  latency_mode: "low",
  reconnect_window_seconds: 60,
}));

// ────────────────────────────────────────────────────────────────────────
// Assets (recordings)
// ────────────────────────────────────────────────────────────────────────

const ASSET_DEFS = [
  { cameraIdx: 0, durationSec: 1847, hoursAgo: 2 },
  { cameraIdx: 0, durationSec: 3620, hoursAgo: 20 },
  { cameraIdx: 1, durationSec: 920, hoursAgo: 6 },
  { cameraIdx: 1, durationSec: 2405, hoursAgo: 36 },
  { cameraIdx: 2, durationSec: 4812, hoursAgo: 10 },
  { cameraIdx: 3, durationSec: 1200, hoursAgo: 3 },
  { cameraIdx: 4, durationSec: 680, hoursAgo: 48 },
  { cameraIdx: 5, durationSec: 540, hoursAgo: 1 },
  { cameraIdx: 5, durationSec: 2100, hoursAgo: 26 },
  { cameraIdx: 6, durationSec: 1590, hoursAgo: 14 },
  { cameraIdx: 6, durationSec: 3300, hoursAgo: 72 },
  { cameraIdx: 7, durationSec: 450, hoursAgo: 96 },
];

export const mockAssets: Asset[] = ASSET_DEFS.map((a, i) => {
  const camera = mockCameras[a.cameraIdx];
  const playbackId = PUBLIC_PLAYBACKS[i % PUBLIC_PLAYBACKS.length];
  return {
    id: `demo-asset-${i + 1}`,
    status: "ready",
    created_at: isoAt(a.hoursAgo * HOUR),
    duration_seconds: a.durationSec,
    max_stored_frame_rate: 30,
    aspect_ratio: "16:9",
    playback_ids: [{ id: playbackId, policy: "public" }],
    tracks: [],
    errors: null,
    master_access: "none",
    master: null,
    normalize_audio: false,
    is_live: false,
    static_renditions: null,
    test: false,
    passthrough: camera.id,
    live_stream_id: camera.id,
    ingest_type: "live_stream",
    source_asset_id: null,
    upload_id: null,
    input_info: null,
    video_quality: "plus",
    resolution_tier: "1080p",
    non_standard_input_reasons: null,
    progress: null,
    meta: { title: `${camera.camera_name} • Recording ${i + 1}` },
    max_resolution_tier: "1080p",
    recording_times: null,
    playbackId,
    createdAt: isoAt(a.hoursAgo * HOUR),
    maxStoredResolution: "1920x1080",
    duration: a.durationSec,
  };
});

// ────────────────────────────────────────────────────────────────────────
// AI analysis events
// ────────────────────────────────────────────────────────────────────────

type EventSeed = {
  name: string;
  description: string;
  severity: AIAnalysisEvent["severity"];
  type: AIAnalysisEvent["type"];
};

const EVENT_SEEDS: EventSeed[] = [
  {
    name: "Unauthorized person detected",
    description:
      "An individual entered the loading dock outside of scheduled delivery hours.",
    severity: "High",
    type: "Crime",
  },
  {
    name: "Person collapsed near reception",
    description:
      "A visitor appears to have fallen near the reception desk and remains on the floor.",
    severity: "High",
    type: "Medical Emergency",
  },
  {
    name: "Vehicle collision in parking lot",
    description:
      "Two vehicles made contact in Parking Lot A; minor damage visible on both.",
    severity: "Medium",
    type: "Traffic Incident",
  },
  {
    name: "Broken window observed",
    description: "A panel on the rear entrance door appears shattered.",
    severity: "Medium",
    type: "Property Damage",
  },
  {
    name: "Wet floor with no signage",
    description:
      "A spill is visible in the lobby with no warning sign deployed.",
    severity: "Minor",
    type: "Safety Hazard",
  },
  {
    name: "Individual loitering near entrance",
    description:
      "Same person has been observed pacing outside the rear entrance for over 15 minutes.",
    severity: "Medium",
    type: "Suspicious Activity",
  },
  {
    name: "Staff check-in",
    description: "Employee badge-in at the main reception.",
    severity: "Minor",
    type: "Normal Activity",
  },
  {
    name: "Camera view obstructed",
    description: "Rooftop camera view has been partially blocked by debris.",
    severity: "Medium",
    type: "Camera Interference",
  },
  {
    name: "Forklift operating without spotter",
    description:
      "A forklift is moving pallets in the warehouse with no secondary observer present.",
    severity: "Medium",
    type: "Safety Hazard",
  },
  {
    name: "Unattended package at entrance",
    description:
      "A package has been left unattended near the front lobby doors for over 20 minutes.",
    severity: "High",
    type: "Suspicious Activity",
  },
  {
    name: "Speeding vehicle",
    description:
      "A vehicle entered the parking area at substantially higher than the posted limit.",
    severity: "Medium",
    type: "Traffic Incident",
  },
  {
    name: "Damaged pallet",
    description: "A pallet near the dock appears split and unsafe to load.",
    severity: "Minor",
    type: "Property Damage",
  },
  {
    name: "Individual tampering with camera",
    description:
      "A person has been observed adjusting the orientation of a perimeter camera.",
    severity: "High",
    type: "Camera Interference",
  },
  {
    name: "Group gathering in restricted area",
    description:
      "Three individuals have congregated in the server room vestibule, which is access-controlled.",
    severity: "High",
    type: "Crime",
  },
  {
    name: "Normal delivery arrival",
    description:
      "Scheduled carrier arrived at the loading dock and proceeded to unload.",
    severity: "Minor",
    type: "Normal Activity",
  },
];

export const mockEvents: AIAnalysisEvent[] = [];
let _eventId = EVENT_ID_BASE;
for (let i = 0; i < 30; i++) {
  const seed = EVENT_SEEDS[i % EVENT_SEEDS.length];
  const asset = mockAssets[i % mockAssets.length];
  mockEvents.push({
    id: _eventId++,
    job_id: JOB_ID_BASE + (i % mockAssets.length),
    asset_id: asset.id,
    name: seed.name,
    description: seed.description,
    severity: seed.severity,
    type: seed.type,
    timestamp_seconds: Math.floor(
      (asset.duration_seconds ?? 600) * (0.05 + (0.9 * pseudoRandom(i)) / 100),
    ),
    affected_entities:
      seed.type === "Traffic Incident"
        ? [
            { type: "vehicle", label: "Sedan (black)" },
            { type: "vehicle", label: "SUV (silver)" },
          ]
        : seed.severity === "High"
          ? [{ type: "person", label: "Unidentified individual" }]
          : [],
    created_at: isoAt((i + 1) * 35 * 60 * 1000),
  });
}

// ────────────────────────────────────────────────────────────────────────
// AI analysis jobs / results
// ────────────────────────────────────────────────────────────────────────

// CV pipeline catalog — the models that ran over the footage in this demo.
// Mirrors a realistic Roboflow + SAM + supporting-model stack.
export const CV_MODELS = [
  "Roboflow: People Detection (YOLOv8)",
  "SAM 2 — instance segmentation",
  "Roboflow: PPE & Safety Compliance",
  "Roboflow: Vehicle & ALPR",
  "Roboflow: Weapon Detection",
  "CLIP — scene embeddings",
  "Whisper — audio transcript",
  "DETR — object detection",
];

// Deterministically assign 2–3 models to a job by index.
function pickModels(i: number): string[] {
  const a = CV_MODELS[i % CV_MODELS.length];
  const b = CV_MODELS[(i * 3 + 1) % CV_MODELS.length];
  const c = CV_MODELS[(i * 5 + 2) % CV_MODELS.length];
  return Array.from(new Set([a, b, ...(i % 2 === 0 ? [c] : [])]));
}

// Status assigned to demo jobs, cycled by index.
const JOB_STATUS_CYCLE: AIAnalysisJob["status"][] = [
  "succeeded",
  "succeeded",
  "succeeded",
  "processing",
  "queued",
  "failed",
];

export const mockAnalysisJobs: AIAnalysisJob[] = mockAssets.map((asset, i) => {
  const status = JOB_STATUS_CYCLE[i % JOB_STATUS_CYCLE.length];
  return {
    id: JOB_ID_BASE + i,
    source_type: "vod",
    source_id: asset.id,
    playback_id:
      (Array.isArray(asset.playback_ids) && asset.playback_ids[0]?.id) ||
      PUBLIC_PLAYBACKS[0],
    start_epoch: Math.floor(new Date(asset.created_at).getTime() / 1000),
    end_epoch:
      Math.floor(new Date(asset.created_at).getTime() / 1000) +
      (asset.duration_seconds ?? 600),
    asset_start_seconds: 0,
    asset_end_seconds: asset.duration_seconds ?? 600,
    status,
    attempts: 1,
    error: status === "failed" ? "Worker timed out after 300s" : null,
    // Succeeded jobs reference their result row.
    result_ref: status === "succeeded" ? JOB_ID_BASE + i : null,
    created_at: asset.created_at,
    updated_at: asset.created_at,
    models: pickModels(i),
  };
});

export const mockAnalysisResults: AIAnalysisResult[] = mockAnalysisJobs
  .filter((j) => j.status === "succeeded")
  .map((j, i) => {
    const cameraName =
      mockAssets.find((a) => a.id === j.source_id)?.meta?.title ?? "camera";
    const personCount = 2 + (i % 4);
    const vehicleCount = i % 3;
    const models = j.models ?? CV_MODELS.slice(0, 2);
    return {
      job_id: j.id,
      summary: `${models[0].split(":")[0].trim()} + ${
        models[1]?.split("—")[0].trim() ?? "SAM 2"
      } processed ${cameraName}. Detected ${personCount} ${
        personCount === 1 ? "person" : "people"
      }${vehicleCount ? ` and ${vehicleCount} vehicle(s)` : ""}. ${
        i % 3 === 0
          ? "Flagged brief loitering near the entrance."
          : "No safety violations or anomalies."
      }`,
      tags: [
        "person",
        ...(vehicleCount ? ["vehicle"] : []),
        i % 2 === 0 ? "indoor" : "outdoor",
        i % 3 === 0 ? "loitering" : "normal",
      ],
      entities: [
        { type: "person", count: personCount },
        { type: "vehicle", count: vehicleCount },
      ],
      transcript_ref: models.some((m) => m.includes("Whisper"))
        ? `transcript-${j.id}`
        : null,
      embeddings_ref: models.some((m) => m.includes("CLIP"))
        ? `clip-${j.id}`
        : null,
      raw: {
        models,
        pipeline: "roboflow-workflow → sam2 → vlm-summary",
        frames_processed: Math.round((j.asset_end_seconds ?? 600) / 2),
        mean_confidence: 0.78 + (i % 10) / 100,
      },
      created_at: j.updated_at,
    };
  });

// ────────────────────────────────────────────────────────────────────────
// Detections (object detection frames per asset)
// ────────────────────────────────────────────────────────────────────────

export interface MockDetectionFrame {
  frame_timestamp: number;
  detections: Array<{
    class: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

export function getMockDetectionsForAsset(
  assetId: string,
): MockDetectionFrame[] {
  const asset = mockAssets.find((a) => a.id === assetId);
  if (!asset) return [];
  const frames: MockDetectionFrame[] = [];
  const duration = asset.duration_seconds ?? 600;
  const frameCount = Math.min(60, Math.floor(duration / 5));
  for (let i = 0; i < frameCount; i++) {
    const t = (duration * i) / frameCount;
    const detections = [];
    const personCount = (i * 7) % 4;
    for (let p = 0; p < personCount; p++) {
      detections.push({
        class: "person",
        confidence: 0.72 + ((i + p) % 20) / 100,
        bbox: {
          x: 0.1 + ((i * 11 + p * 30) % 60) / 100,
          y: 0.2 + ((i * 13 + p * 20) % 40) / 100,
          width: 0.08 + ((i + p) % 5) / 100,
          height: 0.18 + ((i + p) % 7) / 100,
        },
      });
    }
    if (i % 5 === 0) {
      detections.push({
        class: "vehicle",
        confidence: 0.81,
        bbox: { x: 0.55, y: 0.45, width: 0.22, height: 0.18 },
      });
    }
    frames.push({ frame_timestamp: t, detections });
  }
  return frames;
}

// ────────────────────────────────────────────────────────────────────────
// Reports (Tiptap JSON)
// ────────────────────────────────────────────────────────────────────────

function tiptapDoc(blocks: Array<{ h?: string; p?: string }>) {
  return {
    type: "doc",
    content: blocks.map((b) => {
      if (b.h) {
        return {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: b.h }],
        };
      }
      return {
        type: "paragraph",
        content: b.p ? [{ type: "text", text: b.p }] : [],
      };
    }),
  };
}

export const mockReports: Report[] = [
  {
    id: "demo-report-001",
    title: "Weekly Security Summary — Week 16",
    content: tiptapDoc([
      { h: "Overview" },
      {
        p: "This week recorded 34 AI-flagged events across 8 cameras, with 6 events classified as high severity. Overall activity was within expected baselines.",
      },
      { h: "High-severity incidents" },
      {
        p: "Two unauthorized-person events were detected at the Loading Dock outside of business hours. Both were resolved by on-site staff within 15 minutes.",
      },
      { h: "Recommendations" },
      {
        p: "Extend motion-lighting coverage at the rear entrance. Review access-card usage for the server room vestibule.",
      },
    ]),
    created_at: isoAt(4 * DAY),
    updated_at: isoAt(4 * DAY),
  },
  {
    id: "demo-report-002",
    title: "Incident Review: Parking Lot A — Vehicle Contact",
    content: tiptapDoc([
      { h: "Incident" },
      {
        p: "At approximately 14:22 local time, two vehicles made contact in Parking Lot A. Both drivers exited their vehicles and exchanged information without further incident.",
      },
      { h: "Footage references" },
      {
        p: "Primary footage: camera demo-cam-002. Secondary angle from demo-cam-001 available for context.",
      },
      { h: "Outcome" },
      {
        p: "No injuries reported. Insurance information exchanged on-site. No further follow-up required.",
      },
    ]),
    created_at: isoAt(1 * DAY),
    updated_at: isoAt(1 * DAY),
  },
  {
    id: "demo-report-003",
    title: "Monthly Operations Metrics",
    content: tiptapDoc([
      { h: "Camera uptime" },
      {
        p: "Average uptime across active cameras was 99.2%. Rooftop camera remains disabled pending hardware replacement.",
      },
      { h: "Processing volume" },
      {
        p: "384 AI analysis jobs completed this month, with a success rate of 96.3%.",
      },
    ]),
    created_at: isoAt(10 * DAY),
    updated_at: isoAt(10 * DAY),
  },
];

// In-memory store so POST /api/reports + createReport tool persist during a
// single warm server instance. On serverless hosts, cold starts or requests
// routed to a different instance may fall back to seeded reports, which is
// acceptable for an ephemeral public demo.
declare global {
  // eslint-disable-next-line no-var
  var __demoReportStore: Report[] | undefined;
}
export function demoReportStore(): Report[] {
  if (!globalThis.__demoReportStore) {
    globalThis.__demoReportStore = [...mockReports];
  }
  return globalThis.__demoReportStore;
}

// ────────────────────────────────────────────────────────────────────────
// Stats (for /api/stats dashboard)
// ────────────────────────────────────────────────────────────────────────

function dailyTimeline<T extends Record<string, number>>(
  days: number,
  make: (dayIdx: number) => T,
): Array<T & { date: string }> {
  const out: Array<T & { date: string }> = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(NOW - d * DAY).toISOString().split("T")[0];
    out.push({ date, ...make(days - 1 - d) });
  }
  return out;
}

export const mockStats = {
  jobStats: {
    total: mockAnalysisJobs.length,
    queued: mockAnalysisJobs.filter((j) => j.status === "queued").length,
    processing: mockAnalysisJobs.filter((j) => j.status === "processing")
      .length,
    succeeded: mockAnalysisJobs.filter((j) => j.status === "succeeded").length,
    failed: mockAnalysisJobs.filter((j) => j.status === "failed").length,
    dead: 0,
    successRate:
      (mockAnalysisJobs.filter((j) => j.status === "succeeded").length /
        mockAnalysisJobs.length) *
      100,
  },
  topTags: [
    { tag: "person", count: 128 },
    { tag: "vehicle", count: 74 },
    { tag: "outdoor", count: 61 },
    { tag: "indoor", count: 54 },
    { tag: "package", count: 22 },
    { tag: "forklift", count: 18 },
  ],
  assetStats: {
    total: mockAssets.length,
    ready: mockAssets.length,
    processing: 0,
    errored: 0,
  },
  streamStats: {
    total: mockCameras.length,
    active: mockCameras.filter((c) => c.status === "active").length,
    idle: mockCameras.filter((c) => c.status === "idle").length,
    disabled: mockCameras.filter((c) => c.status === "disabled").length,
  },
  detectionStats: {
    totalDetections: 1842,
    totalFrames: 612,
    averageDetectionsPerFrame: 3.01,
    classCounts: [
      { class: "person", count: 1204 },
      { class: "vehicle", count: 412 },
      { class: "package", count: 126 },
      { class: "forklift", count: 100 },
    ],
  },
  cameraActivity: mockCameras.map((c, i) => ({
    camera_id: c.id,
    camera_name: c.camera_name,
    event_count: 40 - i * 4,
  })),
  jobsTimeline: dailyTimeline(14, (d) => ({
    created: 8 + (d % 5),
    succeeded: 7 + (d % 4),
    failed: d % 3 === 0 ? 1 : 0,
  })),
  detectionsTimeline: dailyTimeline(14, (d) => ({
    detections: 80 + d * 6,
    frames: 30 + d * 2,
  })),
  occupancyData: Array.from({ length: 60 }, (_, i) => ({
    timestamp: (NOW - (60 - i) * 60 * 1000) / 1000,
    count: Math.max(0, Math.round(3 + Math.sin(i / 5) * 2 + (i % 4))),
  })),
  processingVolume: dailyTimeline(14, (d) => ({ volume: 6 + (d % 4) })),
  assetDurations: [
    { range: "0-30s", count: 2 },
    { range: "30s-1m", count: 3 },
    { range: "1-5m", count: 4 },
    { range: "5-15m", count: 2 },
    { range: "15-30m", count: 1 },
  ],
  esMetrics: {
    eventSeverity: [
      {
        severity: "High",
        count: mockEvents.filter((e) => e.severity === "High").length,
      },
      {
        severity: "Medium",
        count: mockEvents.filter((e) => e.severity === "Medium").length,
      },
      {
        severity: "Minor",
        count: mockEvents.filter((e) => e.severity === "Minor").length,
      },
    ],
    eventTypes: Array.from(
      mockEvents.reduce((acc, e) => {
        acc.set(e.type, (acc.get(e.type) ?? 0) + 1);
        return acc;
      }, new Map<string, number>()),
    ).map(([type, count]) => ({ type, count })),
    eventTimeline: dailyTimeline(14, (d) => ({ count: 2 + (d % 4) })),
    topEntities: [
      { entity: "person", count: 92, type: "person" },
      { entity: "vehicle", count: 54, type: "vehicle" },
      { entity: "package", count: 18, type: "object" },
    ],
    entityTypes: [
      { type: "person", count: 92 },
      { type: "vehicle", count: 54 },
      { type: "object", count: 24 },
    ],
    assetTypes: [
      {
        type: "live" as const,
        count: mockCameras.filter((c) => c.status === "active").length,
      },
      { type: "vod" as const, count: mockAssets.length },
    ],
    cameraEventPatterns: mockCameras.map((c) => {
      const evs = mockEvents.filter((e) =>
        mockAssets.some(
          (a) => a.id === e.asset_id && a.live_stream_id === c.id,
        ),
      );
      const high = evs.filter((e) => e.severity === "High").length;
      const medium = evs.filter((e) => e.severity === "Medium").length;
      const minor = evs.filter((e) => e.severity === "Minor").length;
      return {
        camera_id: c.id,
        camera_name: c.camera_name,
        high,
        medium,
        minor,
        total: high + medium + minor,
      };
    }),
  },
};
