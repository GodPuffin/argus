/**
 * Elasticsearch Type Definitions
 * 
 * This file contains all type definitions used by the Elasticsearch integration.
 * Import these types in your application code for type safety.
 */

/**
 * Document type for categorizing searchable content
 */
export type DocumentType = 'event' | 'analysis'

/**
 * Asset type (live stream or VOD)
 */
export type AssetType = 'live' | 'vod'

/**
 * Entity types detected in video analysis
 * Matches the public.entity_type enum in the database
 */
export type EntityType = 
  | 'person'
  | 'vehicle'
  | 'car'
  | 'truck'
  | 'bus'
  | 'motorcycle'
  | 'bicycle'
  | 'animal'
  | 'pet'
  | 'dog'
  | 'cat'
  | 'package'
  | 'bag'
  | 'backpack'
  | 'weapon'
  | 'phone'
  | 'laptop'
  | 'object'
  | 'location'
  | 'activity'
  | 'other';

/**
 * Entity detected in video analysis
 */
export interface Entity {
  type: EntityType;
  name: string;
  confidence: number;
}

/**
 * Event severity levels
 */
export type EventSeverity = 'Minor' | 'Medium' | 'High'

/**
 * Event types
 */
export type EventType = 
  | 'Crime'
  | 'Medical Emergency'
  | 'Traffic Incident'
  | 'Property Damage'
  | 'Safety Hazard'
  | 'Suspicious Activity'
  | 'Normal Activity'
  | 'Camera Interference'

/**
 * Filters for search queries
 */
export interface SearchFilters {
  /** Filter by document type */
  doc_type?: DocumentType
  /** Filter by severity (events only) */
  severity?: EventSeverity[]
  /** Filter by event type (events only) */
  event_type?: EventType[]
  /** Filter by date range (ISO 8601 format) */
  dateRange?: {
    from: string
    to: string
  }
}

/**
 * Base document properties shared by all document types
 */
interface BaseDocument {
  /** Document type discriminator */
  doc_type: DocumentType
  /** Asset ID from mux.assets */
  asset_id: string
  /** Asset type (live stream or VOD) */
  asset_type: AssetType
  /** Camera name (for live streams) */
  camera_name?: string
  /** Searchable title */
  title: string
  /** Creation timestamp (ISO 8601 format) */
  created_at: string
  /** Mux playback ID for video player */
  playback_id: string
  /** Video duration in seconds */
  duration?: number
}

/**
 * Event document - represents a detected event in video analysis
 */
export interface EventDocument extends BaseDocument {
  doc_type: 'event'
  /** Event description */
  description: string
  /** Event severity level */
  severity: EventSeverity
  /** Event type category */
  event_type: EventType
  /** Timestamp in seconds from asset start */
  timestamp_seconds: number
  /** Entities involved in the event */
  affected_entities: Entity[]
  /** Optional tags */
  tags?: string[]
}

/**
 * Analysis document - represents a 60-second analyzed segment
 */
export interface AnalysisDocument extends BaseDocument {
  doc_type: 'analysis'
  /** Analysis summary/description */
  summary: string
  /** Tags from analysis */
  tags: string[]
  /** Entities detected in segment */
  entities: Entity[]
  /** Start time in seconds from asset start */
  asset_start_seconds: number
  /** End time in seconds from asset start */
  asset_end_seconds: number
}

/**
 * Union type of all searchable documents
 */
export type SearchDocument = EventDocument | AnalysisDocument

/**
 * Search result hit with relevance score and highlights
 */
export interface SearchHit {
  /** Document ID */
  id: string
  /** Relevance score */
  score: number
  /** Source document */
  source: SearchDocument
  /** Highlighted matching text snippets */
  highlights?: Record<string, string[]>
}

/**
 * Complete search result
 */
export interface SearchResult {
  /** Array of matching documents */
  hits: SearchHit[]
  /** Total number of matching documents */
  total: number
  /** Time taken to execute the search (milliseconds) */
  took: number
}

/**
 * Bulk indexing document structure
 */
export interface BulkIndexDocument {
  /** Document ID */
  id: string
  /** Document to index */
  document: SearchDocument
}

/**
 * Helper function to build document title
 */
export function buildDocumentTitle(
  assetType: AssetType,
  cameraName: string | undefined,
  createdAt: string
): string {
  const dateObj = new Date(createdAt)
  const date = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const time = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  if (assetType === 'live' && cameraName) {
    return `${cameraName} - ${date} - ${time}`
  }
  
  return `Video - ${date} - ${time}`
}

/**
 * Helper function to get Mux thumbnail URL at specific timestamp
 */
export function getThumbnailUrl(playbackId: string, timestampSeconds: number): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${timestampSeconds}`
}

/**
 * Helper function to format duration
 */
export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

