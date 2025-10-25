/**
 * Elasticsearch Type Definitions
 * 
 * This file contains all type definitions used by the Elasticsearch integration.
 * Import these types in your application code for type safety.
 */

/**
 * Content type for categorizing documents
 */
export type ContentType = 'stream' | 'camera' | 'recording'

/**
 * Filters for search queries
 */
export interface SearchFilters {
  /** Filter by content type */
  type?: ContentType
  /** Filter by date range (ISO 8601 format) */
  dateRange?: {
    from: string
    to: string
  }
}

/**
 * Document structure for indexing content
 */
export interface ContentDocument {
  /** Type of content */
  type: ContentType
  /** Title of the content (searchable) */
  title: string
  /** Optional description (searchable) */
  description?: string
  /** Optional full-text content (searchable) */
  content?: string
  /** Optional tags for filtering */
  tags?: string[]
  /** Creation timestamp (ISO 8601 format) */
  created_at: string
  /** Last update timestamp (ISO 8601 format) */
  updated_at: string
  /** Flexible metadata storage */
  metadata?: Record<string, any>
}

/**
 * Search result hit with relevance score and highlights
 */
export interface SearchHit {
  /** Document ID */
  id: string
  /** Relevance score */
  score: number
  /** Source document */
  source: ContentDocument
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
  document: ContentDocument
}

