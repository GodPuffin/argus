/**
 * Elasticsearch Data Synchronization
 * 
 * This module handles syncing MUX data (streams, cameras, recordings) 
 * with the Elasticsearch index for search functionality.
 */

import { indexDocument, bulkIndexDocuments, deleteDocument, type ContentDocument } from './elasticsearch'
import { supabase } from './supabase'

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET

// ============================================================================
// MUX API Helpers
// ============================================================================

async function fetchMuxAPI(endpoint: string) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    throw new Error('MUX credentials not configured')
  }

  const response = await fetch(`https://api.mux.com${endpoint}`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64'),
    },
  })

  if (!response.ok) {
    throw new Error(`MUX API error: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// Data Transformation
// ============================================================================

function transformStreamToDocument(stream: any): ContentDocument {
  return {
    type: 'stream',
    title: `Live Stream ${stream.id.substring(0, 8)}`,
    description: `Live stream with status: ${stream.status}. Latency mode: ${stream.latency_mode || 'standard'}`,
    content: `Stream ID: ${stream.id}. Playback ID: ${stream.playback_ids?.[0]?.id || 'none'}. Recent assets: ${stream.recent_asset_ids?.join(', ') || 'none'}`,
    tags: [
      'mux',
      'live-stream',
      stream.status,
      stream.latency_mode || 'standard',
      stream.playback_ids?.[0]?.policy || 'unknown'
    ].filter(Boolean),
    created_at: stream.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      stream_key: stream.stream_key,
      playback_id: stream.playback_ids?.[0]?.id,
      status: stream.status,
      latency_mode: stream.latency_mode,
      reconnect_window: stream.reconnect_window,
      recent_asset_ids: stream.recent_asset_ids || [],
      test: stream.test || false
    }
  }
}

function transformCameraToDocument(camera: any): ContentDocument {
  return {
    type: 'camera',
    title: camera.camera_name || `Camera ${camera.id.substring(0, 8)}`,
    description: `Live camera with status: ${camera.status}. Browser ID: ${camera.browser_id}. Latency mode: ${camera.latency_mode || 'standard'}`,
    content: `Camera ID: ${camera.id}. Stream Key: ${camera.stream_key}. Playback ID: ${camera.playback_ids?.[0]?.id || 'none'}`,
    tags: [
      'camera',
      'live-stream',
      camera.status,
      camera.latency_mode || 'standard',
      camera.browser_id
    ].filter(Boolean),
    created_at: camera.created_at || new Date().toISOString(),
    updated_at: camera.last_connected_at || camera.updated_at || new Date().toISOString(),
    metadata: {
      browser_id: camera.browser_id,
      stream_key: camera.stream_key,
      playback_id: camera.playback_ids?.[0]?.id,
      status: camera.status,
      latency_mode: camera.latency_mode,
      reconnect_window: camera.reconnect_window_seconds,
      last_connected_at: camera.last_connected_at,
      active_asset_id: camera.active_asset_id
    }
  }
}

function transformAssetToDocument(asset: any): ContentDocument {
  const durationFormatted = asset.duration 
    ? `${Math.floor(asset.duration / 60)}m ${Math.floor(asset.duration % 60)}s`
    : 'unknown duration'

  return {
    type: 'recording',
    title: asset.passthrough || `Recording ${asset.id.substring(0, 8)}`,
    description: `Recorded video (${durationFormatted}). Resolution: ${asset.max_stored_resolution || 'unknown'}. Status: ${asset.status}`,
    content: `Asset ID: ${asset.id}. Playback ID: ${asset.playback_ids?.[0]?.id || 'none'}. Created at ${new Date(asset.created_at).toLocaleString()}`,
    tags: [
      'mux',
      'recording',
      'asset',
      asset.status,
      asset.max_stored_resolution,
      asset.aspect_ratio
    ].filter(Boolean),
    created_at: asset.created_at || new Date().toISOString(),
    updated_at: asset.updated_at || asset.created_at || new Date().toISOString(),
    metadata: {
      playback_id: asset.playback_ids?.[0]?.id,
      status: asset.status,
      duration: asset.duration,
      max_stored_resolution: asset.max_stored_resolution,
      max_stored_frame_rate: asset.max_stored_frame_rate,
      aspect_ratio: asset.aspect_ratio,
      tracks: asset.tracks,
      errors: asset.errors,
      master_access: asset.master_access,
      mp4_support: asset.mp4_support
    }
  }
}

// ============================================================================
// Sync Functions
// ============================================================================

export async function syncAllStreams(): Promise<number> {
  console.log('[Elasticsearch Sync] Syncing live streams...')
  
  try {
    const data = await fetchMuxAPI('/video/v1/live-streams?limit=100')
    const streams = data.data || []

    if (streams.length === 0) {
      console.log('[Elasticsearch Sync] No live streams found')
      return 0
    }

    const documents = streams.map((stream: any) => ({
      id: `stream-${stream.id}`,
      document: transformStreamToDocument(stream)
    }))

    await bulkIndexDocuments(documents)
    console.log(`[Elasticsearch Sync] Synced ${streams.length} live streams`)
    
    return streams.length
  } catch (error) {
    console.error('[Elasticsearch Sync] Error syncing streams:', error)
    throw error
  }
}

export async function syncAllCameras(): Promise<number> {
  console.log('[Elasticsearch Sync] Syncing cameras...')
  
  try {
    const { data: cameras, error } = await supabase
      .schema('mux')
      .from('live_streams')
      .select('*')
      .not('browser_id', 'is', null) // Only get streams with browser_id (cameras)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    if (!cameras || cameras.length === 0) {
      console.log('[Elasticsearch Sync] No cameras found')
      return 0
    }

    const documents = cameras.map((camera: any) => ({
      id: `camera-${camera.id}`,
      document: transformCameraToDocument(camera)
    }))

    await bulkIndexDocuments(documents)
    console.log(`[Elasticsearch Sync] Synced ${cameras.length} cameras`)
    
    return cameras.length
  } catch (error) {
    console.error('[Elasticsearch Sync] Error syncing cameras:', error)
    throw error
  }
}

export async function syncAllAssets(): Promise<number> {
  console.log('[Elasticsearch Sync] Syncing recordings/assets...')
  
  try {
    const data = await fetchMuxAPI('/video/v1/assets?limit=100')
    const assets = data.data || []

    if (assets.length === 0) {
      console.log('[Elasticsearch Sync] No assets found')
      return 0
    }

    const documents = assets.map((asset: any) => ({
      id: `recording-${asset.id}`,
      document: transformAssetToDocument(asset)
    }))

    await bulkIndexDocuments(documents)
    console.log(`[Elasticsearch Sync] Synced ${assets.length} recordings/assets`)
    
    return assets.length
  } catch (error) {
    console.error('[Elasticsearch Sync] Error syncing assets:', error)
    throw error
  }
}

export async function syncAllData(): Promise<{ streams: number; cameras: number; assets: number }> {
  console.log('[Elasticsearch Sync] Starting full data sync...')
  
  const results = {
    streams: 0,
    cameras: 0,
    assets: 0
  }

  try {
    results.streams = await syncAllStreams()
  } catch (error) {
    console.error('[Elasticsearch Sync] Failed to sync streams:', error)
  }

  try {
    results.cameras = await syncAllCameras()
  } catch (error) {
    console.error('[Elasticsearch Sync] Failed to sync cameras:', error)
  }

  try {
    results.assets = await syncAllAssets()
  } catch (error) {
    console.error('[Elasticsearch Sync] Failed to sync assets:', error)
  }

  const total = results.streams + results.cameras + results.assets
  console.log(`[Elasticsearch Sync] Full sync complete: ${total} total documents`)
  console.log(`  - Streams: ${results.streams}`)
  console.log(`  - Cameras: ${results.cameras}`)
  console.log(`  - Assets: ${results.assets}`)

  return results
}

// ============================================================================
// Individual Document Operations
// ============================================================================

export async function indexStream(streamId: string): Promise<void> {
  try {
    const data = await fetchMuxAPI(`/video/v1/live-streams/${streamId}`)
    const stream = data.data
    
    await indexDocument(`stream-${streamId}`, transformStreamToDocument(stream))
    console.log(`[Elasticsearch Sync] Indexed stream: ${streamId}`)
  } catch (error) {
    console.error(`[Elasticsearch Sync] Error indexing stream ${streamId}:`, error)
    throw error
  }
}

export async function indexCamera(cameraId: string): Promise<void> {
  try {
    const { data: camera, error } = await supabase
      .schema('mux')
      .from('live_streams')
      .select('*')
      .eq('id', cameraId)
      .single()

    if (error || !camera) {
      throw new Error(`Camera not found: ${cameraId}`)
    }
    
    await indexDocument(`camera-${cameraId}`, transformCameraToDocument(camera))
    console.log(`[Elasticsearch Sync] Indexed camera: ${cameraId}`)
  } catch (error) {
    console.error(`[Elasticsearch Sync] Error indexing camera ${cameraId}:`, error)
    throw error
  }
}

export async function indexAsset(assetId: string): Promise<void> {
  try {
    const data = await fetchMuxAPI(`/video/v1/assets/${assetId}`)
    const asset = data.data
    
    await indexDocument(`recording-${assetId}`, transformAssetToDocument(asset))
    console.log(`[Elasticsearch Sync] Indexed asset: ${assetId}`)
  } catch (error) {
    console.error(`[Elasticsearch Sync] Error indexing asset ${assetId}:`, error)
    throw error
  }
}

export async function removeStream(streamId: string): Promise<void> {
  await deleteDocument(`stream-${streamId}`)
  console.log(`[Elasticsearch Sync] Removed stream: ${streamId}`)
}

export async function removeCamera(cameraId: string): Promise<void> {
  await deleteDocument(`camera-${cameraId}`)
  console.log(`[Elasticsearch Sync] Removed camera: ${cameraId}`)
}

export async function removeAsset(assetId: string): Promise<void> {
  await deleteDocument(`recording-${assetId}`)
  console.log(`[Elasticsearch Sync] Removed asset: ${assetId}`)
}

