import { Client } from "@elastic/elasticsearch"

// ============================================================================
// Types
// ============================================================================

export type ContentType = 'stream' | 'camera' | 'recording'

export interface SearchFilters {
  type?: ContentType
  dateRange?: {
    from: string
    to: string
  }
}

export interface ContentDocument {
  type: ContentType
  title: string
  description?: string
  content?: string
  tags?: string[]
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface SearchHit {
  id: string
  score: number
  source: ContentDocument
  highlights?: Record<string, string[]>
}

export interface SearchResult {
  hits: SearchHit[]
  total: number
  took: number
}

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

const INDEX_MAPPING = {
  mappings: {
    properties: {
      type: { 
        type: 'keyword' 
      },
      title: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      description: {
        type: 'text',
        analyzer: 'standard'
      },
      content: {
        type: 'text',
        analyzer: 'standard'
      },
      tags: { 
        type: 'keyword' 
      },
      created_at: { 
        type: 'date' 
      },
      updated_at: { 
        type: 'date' 
      },
      metadata: { 
        type: 'object',
        enabled: true
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

function buildSearchQuery(query: string, filters?: SearchFilters) {
  const searchBody: any = {
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: [
                'title^2',        // Boost title matches by 2x
                'description',
                'content',
                'tags'
              ],
              type: 'best_fields',
              fuzziness: 'AUTO'   // Automatic fuzzy matching for typos
            }
          }
        ]
      }
    },
    highlight: {
      fields: {
        title: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
        description: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
        content: { pre_tags: ['<mark>'], post_tags: ['</mark>'] }
      },
      fragment_size: 150,
      number_of_fragments: 3
    },
    size: SEARCH_RESULT_SIZE
  }

  // Apply filters
  if (filters) {
    const filterQueries: any[] = []

    if (filters.type) {
      filterQueries.push({
        term: { type: filters.type }
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

export async function searchContent(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult> {
  // Check if Elasticsearch is configured
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
// Document Operations
// ============================================================================

export async function indexDocument(
  id: string,
  document: ContentDocument
): Promise<void> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Skipping indexing.')
    return
  }

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
  updates: Partial<ContentDocument>
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
  documents: Array<{ id: string; document: ContentDocument }>
): Promise<void> {
  if (!esClient) {
    console.warn('[Elasticsearch] Client not configured. Skipping bulk indexing.')
    return
  }

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
