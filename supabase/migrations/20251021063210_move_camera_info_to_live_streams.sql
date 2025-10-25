-- Move camera information into mux.live_streams table
-- This creates a single source of truth with instant realtime updates from Mux webhooks

-- Add camera-specific fields to mux.live_streams table
ALTER TABLE mux.live_streams
  ADD COLUMN IF NOT EXISTS browser_id TEXT,
  ADD COLUMN IF NOT EXISTS camera_name TEXT DEFAULT 'Unnamed Camera',
  ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on browser_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_live_streams_browser_id 
  ON mux.live_streams(browser_id);

-- Create unique index to ensure one stream per browser
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_streams_browser_id_unique
  ON mux.live_streams(browser_id)
  WHERE browser_id IS NOT NULL;

-- Migrate existing data from public.cameras to mux.live_streams
-- Match cameras to live streams by mux_stream_id
UPDATE mux.live_streams ls
SET 
  browser_id = c.browser_id,
  camera_name = c.camera_name,
  last_connected_at = c.last_connected_at
FROM public.cameras c
WHERE ls.id = c.mux_stream_id;

-- Enable realtime for mux.live_streams table
ALTER PUBLICATION supabase_realtime ADD TABLE mux.live_streams;
ALTER TABLE mux.live_streams REPLICA IDENTITY FULL;

-- Drop the old public.cameras table (no longer needed!)
DROP TABLE IF EXISTS public.cameras CASCADE;

-- Create a view for backward compatibility during transition (optional)
-- This makes the live_streams data accessible via the familiar "cameras" name
CREATE OR REPLACE VIEW public.cameras AS
SELECT
  id,
  browser_id,
  camera_name,
  id as mux_stream_id,
  stream_key,
  (playback_ids->0->>'id') as playback_id,
  status,
  created_at,
  last_connected_at
FROM mux.live_streams
WHERE browser_id IS NOT NULL;

