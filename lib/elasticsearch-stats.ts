/**
 * Elasticsearch Statistics and Aggregations
 * 
 * This module provides aggregation queries for analytics on indexed events and analysis results.
 * Uses Elasticsearch aggregation API for efficient large-scale analytics.
 */

import { esClient } from './elasticsearch'

const ELASTICSEARCH_INDEX = 'content'

export interface TimeRange {
  start: Date
  end: Date
}

export interface EventSeverityData {
  severity: string
  count: number
}

export interface EventTypeData {
  type: string
  count: number
}

export interface EventTimelineData {
  date: string
  count: number
}

export interface EntityData {
  entity: string
  count: number
  type?: string
}

export interface EntityTypeData {
  type: string
  count: number
}

export interface AssetTypeData {
  type: 'live' | 'vod'
  count: number
}

export interface CameraEventPattern {
  camera_name: string
  camera_id: string
  high: number
  medium: number
  minor: number
  total: number
}

export interface ElasticsearchStats {
  eventSeverity: EventSeverityData[]
  eventTypes: EventTypeData[]
  eventTimeline: EventTimelineData[]
  topEntities: EntityData[]
  entityTypes: EntityTypeData[]
  assetTypes: AssetTypeData[]
  cameraEventPatterns: CameraEventPattern[]
}

/**
 * Get event severity distribution
 */
export async function getEventSeverityDistribution(
  timeRange?: TimeRange
): Promise<EventSeverityData[]> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured')
    return []
  }

  try {
    const query: any = {
      bool: {
        must: [
          { term: { doc_type: 'event' } }
        ]
      }
    }

    if (timeRange) {
      query.bool.filter = [
        {
          range: {
            created_at: {
              gte: timeRange.start.toISOString(),
              lte: timeRange.end.toISOString()
            }
          }
        }
      ]
    }

    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        query,
        aggs: {
          severity_distribution: {
            terms: {
              field: 'severity',
              size: 10
            }
          }
        }
      }
    })

    const responseData = response.body || response
    const buckets = responseData.aggregations?.severity_distribution?.buckets || []

    return buckets.map((bucket: any) => ({
      severity: bucket.key,
      count: bucket.doc_count
    }))
  } catch (error) {
    console.error('[ES Stats] Error fetching severity distribution:', error)
    return []
  }
}

/**
 * Get event type breakdown
 */
export async function getEventTypeBreakdown(
  timeRange?: TimeRange
): Promise<EventTypeData[]> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured')
    return []
  }

  try {
    const query: any = {
      bool: {
        must: [
          { term: { doc_type: 'event' } }
        ]
      }
    }

    if (timeRange) {
      query.bool.filter = [
        {
          range: {
            created_at: {
              gte: timeRange.start.toISOString(),
              lte: timeRange.end.toISOString()
            }
          }
        }
      ]
    }

    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        query,
        aggs: {
          event_types: {
            terms: {
              field: 'event_type',
              size: 20
            }
          }
        }
      }
    })

    const responseData = response.body || response
    const buckets = responseData.aggregations?.event_types?.buckets || []

    return buckets.map((bucket: any) => ({
      type: bucket.key,
      count: bucket.doc_count
    }))
  } catch (error) {
    console.error('[ES Stats] Error fetching event types:', error)
    return []
  }
}

/**
 * Get event timeline (histogram over time)
 */
export async function getEventTimeline(
  timeRange?: TimeRange,
  interval: 'day' | 'hour' | 'week' = 'day'
): Promise<EventTimelineData[]> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured')
    return []
  }

  try {
    const query: any = {
      bool: {
        must: [
          { term: { doc_type: 'event' } }
        ]
      }
    }

    if (timeRange) {
      query.bool.filter = [
        {
          range: {
            created_at: {
              gte: timeRange.start.toISOString(),
              lte: timeRange.end.toISOString()
            }
          }
        }
      ]
    }

    // Map interval to calendar interval
    const calendarInterval = interval === 'day' ? '1d' : interval === 'hour' ? '1h' : '1w'

    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        query,
        aggs: {
          events_over_time: {
            date_histogram: {
              field: 'created_at',
              calendar_interval: calendarInterval,
              format: 'yyyy-MM-dd',
              min_doc_count: 0
            }
          }
        }
      }
    })

    const responseData = response.body || response
    const buckets = responseData.aggregations?.events_over_time?.buckets || []

    return buckets.map((bucket: any) => ({
      date: bucket.key_as_string,
      count: bucket.doc_count
    }))
  } catch (error) {
    console.error('[ES Stats] Error fetching event timeline:', error)
    return []
  }
}

/**
 * Get top entities from events (by entity name)
 */
export async function getTopEntities(
  limit: number = 20,
  timeRange?: TimeRange
): Promise<EntityData[]> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured')
    return []
  }

  try {
    const query: any = {
      bool: {
        must: [
          { term: { doc_type: 'event' } },
          { exists: { field: 'affected_entities' } }
        ]
      }
    }

    if (timeRange) {
      query.bool.filter = [
        {
          range: {
            created_at: {
              gte: timeRange.start.toISOString(),
              lte: timeRange.end.toISOString()
            }
          }
        }
      ]
    }

    // Fallback: Fetch documents and manually count entities
    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        size: 1000,
        query,
        _source: ['affected_entities']
      }
    })

    const responseData = response.body || response
    const hits = responseData.hits?.hits || []
    
    // Manually count entity names with their types
    const entityCounts = new Map<string, { count: number; type: string }>()
    
    for (const hit of hits) {
      const entities = hit._source?.affected_entities || []
      for (const entity of entities) {
        const name = entity.name || 'unknown'
        const type = entity.type || 'unknown'
        
        if (entityCounts.has(name)) {
          entityCounts.get(name)!.count++
        } else {
          entityCounts.set(name, { count: 1, type })
        }
      }
    }

    return Array.from(entityCounts.entries())
      .map(([entity, data]) => ({ 
        entity, 
        count: data.count,
        type: data.type
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  } catch (error) {
    console.error('[ES Stats] Error fetching top entities:', error)
    return []
  }
}

/**
 * Get entity type breakdown (person, object, location)
 */
export async function getEntityTypeBreakdown(
  timeRange?: TimeRange
): Promise<EntityTypeData[]> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured')
    return []
  }

  try {
    const query: any = {
      bool: {
        must: [
          { term: { doc_type: 'event' } },
          { exists: { field: 'affected_entities' } }
        ]
      }
    }

    if (timeRange) {
      query.bool.filter = [
        {
          range: {
            created_at: {
              gte: timeRange.start.toISOString(),
              lte: timeRange.end.toISOString()
            }
          }
        }
      ]
    }

    // Fetch documents and manually count entity types
    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        size: 1000,
        query,
        _source: ['affected_entities']
      }
    })

    const responseData = response.body || response
    const hits = responseData.hits?.hits || []
    
    // Count by entity type
    const typeCounts = new Map<string, number>()
    
    for (const hit of hits) {
      const entities = hit._source?.affected_entities || []
      for (const entity of entities) {
        const type = entity.type || 'unknown'
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
      }
    }

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('[ES Stats] Error fetching entity type breakdown:', error)
    return []
  }
}

/**
 * Get asset type distribution (live vs VOD)
 */
export async function getAssetTypeDistribution(
  timeRange?: TimeRange
): Promise<AssetTypeData[]> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured')
    return []
  }

  try {
    const query: any = {
      bool: {
        must: []
      }
    }

    if (timeRange) {
      query.bool.filter = [
        {
          range: {
            created_at: {
              gte: timeRange.start.toISOString(),
              lte: timeRange.end.toISOString()
            }
          }
        }
      ]
    }

    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        query,
        aggs: {
          asset_types: {
            terms: {
              field: 'asset_type',
              size: 10
            }
          }
        }
      }
    })

    const responseData = response.body || response
    const buckets = responseData.aggregations?.asset_types?.buckets || []

    return buckets.map((bucket: any) => ({
      type: bucket.key as 'live' | 'vod',
      count: bucket.doc_count
    }))
  } catch (error) {
    console.error('[ES Stats] Error fetching asset types:', error)
    return []
  }
}

/**
 * Get camera event patterns (events grouped by camera with severity breakdown)
 */
export async function getCameraEventPatterns(
  limit: number = 10,
  timeRange?: TimeRange
): Promise<CameraEventPattern[]> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured')
    return []
  }

  try {
    const query: any = {
      bool: {
        must: [
          { term: { doc_type: 'event' } },
          { exists: { field: 'camera_name' } }
        ]
      }
    }

    if (timeRange) {
      query.bool.filter = [
        {
          range: {
            created_at: {
              gte: timeRange.start.toISOString(),
              lte: timeRange.end.toISOString()
            }
          }
        }
      ]
    }

    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        query,
        aggs: {
          cameras: {
            terms: {
              field: 'camera_name.keyword',
              size: limit
            },
            aggs: {
              severities: {
                terms: {
                  field: 'severity',
                  size: 10
                }
              },
              asset_id: {
                terms: {
                  field: 'asset_id',
                  size: 1
                }
              }
            }
          }
        }
      }
    })

    const responseData = response.body || response
    const buckets = responseData.aggregations?.cameras?.buckets || []

    return buckets.map((bucket: any) => {
      const severities = bucket.severities?.buckets || []
      const severityMap = new Map(
        severities.map((s: any) => [s.key, s.doc_count])
      )

      return {
        camera_name: bucket.key,
        camera_id: bucket.asset_id?.buckets?.[0]?.key || '',
        high: severityMap.get('High') || 0,
        medium: severityMap.get('Medium') || 0,
        minor: severityMap.get('Minor') || 0,
        total: bucket.doc_count
      }
    })
  } catch (error) {
    console.error('[ES Stats] Error fetching camera event patterns:', error)
    return []
  }
}

/**
 * Get all Elasticsearch statistics in one call
 */
export async function getAllElasticsearchStats(
  timeRange?: TimeRange
): Promise<ElasticsearchStats> {
  if (!esClient) {
    console.warn('[ES Stats] Client not configured, returning empty stats')
    return {
      eventSeverity: [],
      eventTypes: [],
      eventTimeline: [],
      topEntities: [],
      assetTypes: [],
      cameraEventPatterns: []
    }
  }

  try {
    // Fetch all stats in parallel
    const [
      eventSeverity,
      eventTypes,
      eventTimeline,
      topEntities,
      entityTypes,
      assetTypes,
      cameraEventPatterns
    ] = await Promise.all([
      getEventSeverityDistribution(timeRange),
      getEventTypeBreakdown(timeRange),
      getEventTimeline(timeRange, 'day'),
      getTopEntities(20, timeRange),
      getEntityTypeBreakdown(timeRange),
      getAssetTypeDistribution(timeRange),
      getCameraEventPatterns(10, timeRange)
    ])

    return {
      eventSeverity,
      eventTypes,
      eventTimeline,
      topEntities,
      entityTypes,
      assetTypes,
      cameraEventPatterns
    }
  } catch (error) {
    console.error('[ES Stats] Error fetching all stats:', error)
    return {
      eventSeverity: [],
      eventTypes: [],
      eventTimeline: [],
      topEntities: [],
      entityTypes: [],
      assetTypes: [],
      cameraEventPatterns: []
    }
  }
}

/**
 * Helper function to get time range based on filter
 */
export function getTimeRangeFromFilter(filter: '24h' | '7d' | '30d' | 'all'): TimeRange | undefined {
  if (filter === 'all') {
    return undefined
  }

  const end = new Date()
  let start: Date

  switch (filter) {
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      return undefined
  }

  return { start, end }
}

