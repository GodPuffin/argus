import { NextRequest, NextResponse } from 'next/server'
import { 
  syncEventToElasticsearch, 
  syncAnalysisToElasticsearch,
  syncAllToElasticsearch 
} from '@/lib/elasticsearch-sync'

/**
 * POST /api/search/sync
 * 
 * Sync specific items or all items to Elasticsearch
 * 
 * Query params:
 * - type: 'event' | 'analysis' | 'all' (required)
 * - id: event_id or job_id (required if type is 'event' or 'analysis')
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required parameter: type' },
        { status: 400 }
      )
    }

    if (type === 'all') {
      const result = await syncAllToElasticsearch()
      return NextResponse.json({
        success: true,
        message: 'Full sync completed',
        counts: result
      })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    if (type === 'event') {
      await syncEventToElasticsearch(id)
      return NextResponse.json({
        success: true,
        message: `Event ${id} synced to Elasticsearch`
      })
    }

    if (type === 'analysis') {
      await syncAnalysisToElasticsearch(id)
      return NextResponse.json({
        success: true,
        message: `Analysis ${id} synced to Elasticsearch`
      })
    }

    return NextResponse.json(
      { error: `Invalid type: ${type}. Must be 'event', 'analysis', or 'all'` },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[API] Sync error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync to Elasticsearch',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
