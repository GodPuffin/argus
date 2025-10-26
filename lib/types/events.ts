export enum EventType {
  RECORDING_STARTED = "RECORDING_STARTED",
  RECORDING_COMPLETED = "RECORDING_COMPLETED",
  RECORDING_FAILED = "RECORDING_FAILED",
  STREAM_CONNECTED = "STREAM_CONNECTED",
  STREAM_DISCONNECTED = "STREAM_DISCONNECTED",
  STREAM_IDLE = "STREAM_IDLE",
  ASSET_CREATED = "ASSET_CREATED",
  ASSET_READY = "ASSET_READY",
  ASSET_ERRORED = "ASSET_ERRORED",
  ENCODING_STARTED = "ENCODING_STARTED",
  ENCODING_COMPLETED = "ENCODING_COMPLETED",
  PLAYBACK_READY = "PLAYBACK_READY",
}

export enum EventStatus {
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  INFO = "INFO",
}

export interface Event {
  id: string;
  timestamp: string;
  type: EventType;
  status: EventStatus;
  message: string;
  metadata?: Record<string, any>;
}

// Badge variant type based on shadcn/ui badge component
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/**
 * Maps event status to appropriate badge variant
 */
export function getEventStatusBadgeVariant(status: EventStatus): BadgeVariant {
  switch (status) {
    case EventStatus.SUCCESS:
      return "default";
    case EventStatus.WARNING:
      return "outline";
    case EventStatus.ERROR:
      return "destructive";
    case EventStatus.INFO:
      return "secondary";
    default:
      return "secondary";
  }
}

/**
 * Formats event type into human-readable text
 */
export function formatEventType(type: EventType): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Generates mock events for a recording (temporary until real events are integrated)
 */
export function generateMockEvents(assetId: string): Event[] {
  return [
    {
      id: `${assetId}-1`,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: EventType.STREAM_CONNECTED,
      status: EventStatus.SUCCESS,
      message: "Stream connection established",
    },
    {
      id: `${assetId}-2`,
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      type: EventType.RECORDING_STARTED,
      status: EventStatus.INFO,
      message: "Recording initiated",
    },
    {
      id: `${assetId}-3`,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: EventType.STREAM_DISCONNECTED,
      status: EventStatus.INFO,
      message: "Stream ended",
    },
    {
      id: `${assetId}-4`,
      timestamp: new Date(Date.now() - 1700000).toISOString(),
      type: EventType.RECORDING_COMPLETED,
      status: EventStatus.SUCCESS,
      message: "Recording saved successfully",
    },
    {
      id: `${assetId}-5`,
      timestamp: new Date(Date.now() - 1600000).toISOString(),
      type: EventType.ENCODING_STARTED,
      status: EventStatus.INFO,
      message: "Video encoding in progress",
    },
    {
      id: `${assetId}-6`,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: EventType.ENCODING_COMPLETED,
      status: EventStatus.SUCCESS,
      message: "Video encoding completed",
    },
    {
      id: `${assetId}-7`,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: EventType.PLAYBACK_READY,
      status: EventStatus.SUCCESS,
      message: "Video ready for playback",
    },
  ];
}
