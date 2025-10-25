import { Client } from "@elastic/elasticsearch"
import type { 
  SearchDocument, 
  SearchFilters, 
  SearchResult, 
  SearchHit,
  BulkIndexDocument 
} from "./types/elasticsearch"

// Re-export types for convenience
export type { 
  SearchDocument, 
  SearchFilters, 
  SearchResult, 
  SearchHit,
  EventDocument,
  AnalysisDocument,
  BulkIndexDocument
} from "./types/elasticsearch"

// ============================================================================
// Configuration
// ============================================================================

const ELASTICSEARCH_INDEX = 'content'
const SEARCH_RESULT_SIZE = 20

const isElasticsearchConfigured = (): boolean => {
  return !!(process.env.ELASTICSEARCH_URL && process.env.ELASTICSEARCH_API_KEY)
}

// ============================================================================
// Client Initialization
// ============================================================================

export const esClient = isElasticsearchConfigured()
  ? new Client({
      node: process.env.ELASTICSEARCH_URL!,
      auth: { apiKey: process.env.ELASTICSEARCH_API_KEY! },
    })
  : null

// ============================================================================
// Index Management
// ============================================================================

// Hybrid Search Index Mapping
// Combines AI-powered semantic search with traditional lexical search
// Reference: https://www.elastic.co/docs/solutions/search/hybrid-semantic-text
const INDEX_MAPPING = {
  mappings: {
    properties: {
      // Base fields
      doc_type: { 
        type: 'keyword' 
      },
      asset_id: {
        type: 'keyword'
      },
      asset_type: {
        type: 'keyword'
      },
      camera_name: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      
      // Text fields with semantic_text multi-fields for hybrid search
      title: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' },
          semantic: {
            type: 'semantic_text',
            inference_id: '.elser-2-elasticsearch'
          }
        }
      },
      
      created_at: { 
        type: 'date' 
      },
      playback_id: {
        type: 'keyword'
      },
      duration: {
        type: 'integer'
      },
      
      // Event-specific fields
      description: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          semantic: {
            type: 'semantic_text',
            inference_id: '.elser-2-elasticsearch'
          }
        }
      },
      severity: {
        type: 'keyword'
      },
      event_type: {
        type: 'keyword'
      },
      timestamp_seconds: {
        type: 'integer'
      },
      affected_entities: {
        type: 'object',
        enabled: true
      },
      
      // Analysis-specific fields
      summary: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          semantic: {
            type: 'semantic_text',
            inference_id: '.elser-2-elasticsearch'
          }
        }
      },
      tags: { 
        type: 'keyword',
        fields: {
          semantic: {
            type: 'semantic_text',
            inference_id: '.elser-2-elasticsearch'
          }
        }
      },
      entities: {
        type: 'object',
        enabled: true
      },
      asset_start_seconds: {
        type: 'integer'
      },
      asset_end_seconds: {
        type: 'integer'
      }
    }
  }
}

async function createContentIndex(): Promise<void> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Cannot create index.')
    return
  }

  try {
    await esClient.indices.create({
      index: ELASTICSEARCH_INDEX,
      ...INDEX_MAPPING
    } as any)
    console.log(`[Elasticsearch] Index '${ELASTICSEARCH_INDEX}' created successfully`)
  } catch (error) {
    console.error('[Elasticsearch] Error creating index:', error)
    throw error
  }
}

async function checkIndexExists(): Promise<boolean> {
  if (!esClient) return false
  
  try {
    const exists = await esClient.indices.exists({ 
      index: ELASTICSEARCH_INDEX 
    })
    return exists
  } catch (error) {
    console.error('[Elasticsearch] Error checking index existence:', error)
    return false
  }
}

// ============================================================================
// Search Operations
// ============================================================================

// Build hybrid search query combining semantic and lexical search
// Reference: https://www.elastic.co/docs/solutions/search/hybrid-semantic-text
function buildSearchQuery(query: string, filters?: SearchFilters) {
  // Use match_all for wildcard searches (when only filters are present)
  const isWildcard = query === '*'
  
  const searchBody: any = {
    query: {
      bool: {
        must: isWildcard ? [
          { match_all: {} }
        ] : [
          // Hybrid search: combine semantic and lexical search
          {
            bool: {
              should: [
                // Lexical search on text fields
                {
                  multi_match: {
                    query,
                    fields: [
                      'title^3',
                      'description^2',
                      'summary^2',
                      'tags^1.5',
                      'camera_name'
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                  }
                },
                // Semantic search on semantic_text subfields
                // Uses ELSER embeddings for AI-powered meaning-based search
                {
                  bool: {
                    should: [
                      { match: { 'title.semantic': query } },
                      { match: { 'description.semantic': query } },
                      { match: { 'summary.semantic': query } },
                      { match: { 'tags.semantic': query } }
                    ]
                  }
                }
              ],
              minimum_should_match: 1
            }
          }
        ]
      }
    },
    size: SEARCH_RESULT_SIZE,
    sort: [
      '_score',
      { created_at: { order: 'desc' } }
    ]
  }

  // Apply filters
  if (filters) {
    const filterQueries: any[] = []

    if (filters.doc_type) {
      filterQueries.push({
        term: { doc_type: filters.doc_type }
      })
    }

    if (filters.severity && filters.severity.length > 0) {
      filterQueries.push({
        terms: { severity: filters.severity }
      })
    }

    if (filters.event_type && filters.event_type.length > 0) {
      filterQueries.push({
        terms: { event_type: filters.event_type }
      })
    }

    if (filters.dateRange) {
      filterQueries.push({
        range: {
          created_at: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to
          }
        }
      })
    }

    if (filterQueries.length > 0) {
      searchBody.query.bool.filter = filterQueries
    }
  }

  return searchBody
}

function parseSearchResponse(response: any): SearchResult {
  // Handle response structure (newer versions return response directly, older versions use response.body)
  const responseData = response.body || response

  return {
    hits: responseData.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      source: hit._source,
      highlights: hit.highlight
    })),
    total: responseData.hits.total.value ?? responseData.hits.total,
    took: responseData.took
  }
}

// Hybrid search combining AI-powered semantic search with traditional lexical search
export async function searchContent(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Returning empty results.')
    return {
      hits: [],
      total: 0,
      took: 0
    }
  }

  const searchBody = buildSearchQuery(query, filters)

  try {
    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: searchBody
    })

    return parseSearchResponse(response)
  } catch (error: any) {
    // Handle index not found error
    if (error.meta?.statusCode === 404 && 
        error.body?.error?.type === 'index_not_found_exception') {
      console.warn(`[Elasticsearch] Index '${ELASTICSEARCH_INDEX}' not found. Creating...`)
      await createContentIndex()
      return {
        hits: [],
        total: 0,
        took: 0
      }
    }

    console.error('[Elasticsearch] Search error:', error)
    throw new Error('Search failed')
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export async function ensureIndexExists(): Promise<void> {
  if (!esClient) return

  const exists = await checkIndexExists()
  if (!exists) {
    console.log(`[Elasticsearch] Index '${ELASTICSEARCH_INDEX}' does not exist. Creating...`)
    await createContentIndex()
  }
}

export function isConfigured(): boolean {
  return esClient !== null
}

// ============================================================================
// Document Operations
// ============================================================================

export async function indexDocument(
  id: string,
  document: SearchDocument
): Promise<void> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Skipping indexing.')
    return
  }

  // Ensure index exists with proper mapping before indexing
  await ensureIndexExists()

  try {
    await esClient.index({
      index: ELASTICSEARCH_INDEX,
      id,
      body: document,
      refresh: 'wait_for' // Wait for index refresh to make document searchable
    })
    
    console.log(`[Elasticsearch] Document indexed: ${id}`)
  } catch (error) {
    console.error(`[Elasticsearch] Indexing error for document ${id}:`, error)
    throw new Error(`Failed to index document: ${id}`)
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<SearchDocument>
): Promise<void> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Skipping update.')
    return
  }

  try {
    await esClient.update({
      index: ELASTICSEARCH_INDEX,
      id,
      body: {
        doc: updates
      },
      refresh: 'wait_for'
    } as any)
    
    console.log(`[Elasticsearch] Document updated: ${id}`)
  } catch (error) {
    console.error(`[Elasticsearch] Update error for document ${id}:`, error)
    throw new Error(`Failed to update document: ${id}`)
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Skipping deletion.')
    return
  }

  try {
    await esClient.delete({
      index: ELASTICSEARCH_INDEX,
      id,
      refresh: 'wait_for'
    })
    
    console.log(`[Elasticsearch] Document deleted: ${id}`)
  } catch (error: any) {
    // Ignore not found errors
    if (error.meta?.statusCode === 404) {
      console.warn(`[Elasticsearch] Document not found: ${id}`)
      return
    }
    
    console.error(`[Elasticsearch] Delete error for document ${id}:`, error)
    throw new Error(`Failed to delete document: ${id}`)
  }
}

export async function bulkIndexDocuments(
  documents: BulkIndexDocument[]
): Promise<void> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Skipping bulk indexing.')
    return
  }

  if (documents.length === 0) {
    console.log('[Elasticsearch] No documents to index')
    return
  }

  // Ensure index exists with proper mapping before bulk indexing
  await ensureIndexExists()

  try {
    const body = documents.flatMap(({ id, document }) => [
      { index: { _index: ELASTICSEARCH_INDEX, _id: id } },
      document
    ])

    const response = await esClient.bulk({
      body,
      refresh: 'wait_for'
    })

    if (response.errors) {
      console.error('[Elasticsearch] Bulk indexing had errors:', response.items)
    } else {
      console.log(`[Elasticsearch] Bulk indexed ${documents.length} documents`)
    }
  } catch (error) {
    console.error('[Elasticsearch] Bulk indexing error:', error)
    throw new Error('Failed to bulk index documents')
  }
}

export async function deleteDocumentsByAssetId(assetId: string): Promise<number> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Skipping deletion.')
    return 0
  }

  try {
    const response = await esClient.deleteByQuery({
      index: ELASTICSEARCH_INDEX,
      query: {
        term: {
          asset_id: assetId
        }
      },
      refresh: true
    } as any)

    // Handle response structure (newer versions return response directly, older versions use response.body)
    const responseData = (response as any).body || response
    const deleted = responseData.deleted || 0
    
    console.log(`[Elasticsearch] Deleted ${deleted} documents for asset ${assetId}`)
    return deleted
  } catch (error: any) {
    // Ignore index not found errors
    if (error.meta?.statusCode === 404) {
      console.warn(`[Elasticsearch] Index not found when deleting documents for asset ${assetId}`)
      return 0
    }
    
    console.error(`[Elasticsearch] Error deleting documents for asset ${assetId}:`, error)
    throw new Error(`Failed to delete documents for asset: ${assetId}`)
  }
}