-- Asset-Based Live Analysis
-- Process live stream DVR by following assets instead of live streams
-- This ensures we use the correct asset playback_id and relative time offsets

-- Add column to track which assets have been fully processed
ALTER TABLE mux.assets 
ADD COLUMN IF NOT EXISTS ai_analysis_complete boolean DEFAULT false;

COMMENT ON COLUMN mux.assets.ai_analysis_complete IS 'True when all segments of this asset have been analyzed (only set when is_live=false)';

-- Drop the old live stream based function
DROP FUNCTION IF EXISTS process_live_stream_segments();

-- Create new asset-based processing function
CREATE OR REPLACE FUNCTION process_live_asset_segments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  asset_record RECORD;
  window_size INT := 60;
  asset_duration INT;
  num_complete_windows INT;
  window_start INT;
  window_end INT;
  playback_id TEXT;
  existing_count INT;
BEGIN
  -- Process all assets that are from live streams and not yet complete
  FOR asset_record IN 
    SELECT 
      id,
      live_stream_id,
      is_live,
      FLOOR(COALESCE(duration_seconds, 0))::INT as duration,
      playback_ids
    FROM mux.assets
    WHERE live_stream_id IS NOT NULL
      AND ai_analysis_complete = false
      AND status = 'ready'
  LOOP
    -- Skip if no playback IDs
    IF jsonb_array_length(asset_record.playback_ids) = 0 THEN
      RAISE NOTICE 'Asset % has no playback_ids, skipping', asset_record.id;
      CONTINUE;
    END IF;
    
    playback_id := asset_record.playback_ids->0->>'id';
    asset_duration := asset_record.duration;
    
    -- Calculate how many complete 60-second windows exist
    num_complete_windows := FLOOR(asset_duration / window_size);
    
    IF num_complete_windows = 0 THEN
      RAISE NOTICE 'Asset % only has % seconds, skipping', asset_record.id, asset_duration;
      CONTINUE;
    END IF;
    
    RAISE NOTICE 'Asset %: duration=%ss, complete_windows=%, is_live=%', 
      asset_record.id, asset_duration, num_complete_windows, asset_record.is_live;
    
    -- Enqueue jobs for each complete window that doesn't exist yet
    FOR i IN 0..(num_complete_windows - 1) LOOP
      window_start := i * window_size;
      window_end := (i + 1) * window_size;
      
      -- Check if this window already exists
      SELECT COUNT(*) INTO existing_count
      FROM public.ai_analysis_jobs
      WHERE source_id = asset_record.id
        AND source_type = 'vod'  -- Use 'vod' type since we're using relative offsets
        AND start_epoch = window_start
        AND end_epoch = window_end;
      
      IF existing_count = 0 THEN
        -- Insert new job
        INSERT INTO public.ai_analysis_jobs (
          source_type,
          source_id,
          playback_id,
          start_epoch,
          end_epoch,
          status
        )
        VALUES (
          'vod',  -- Use 'vod' type - relative offsets work the same way
          asset_record.id,
          playback_id,
          window_start,
          window_end,
          'queued'
        );
        
        RAISE NOTICE 'Enqueued job for asset % window [%, %)', 
          asset_record.id, window_start, window_end;
      END IF;
    END LOOP;
    
    -- If asset is no longer live (is_live = false), mark as complete
    IF asset_record.is_live = false THEN
      UPDATE mux.assets
      SET ai_analysis_complete = true
      WHERE id = asset_record.id;
      
      RAISE NOTICE 'Asset % marked as complete (is_live=false)', asset_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Live asset segment processing complete';
END;
$$;

-- Update the cron job to use the new function
SELECT cron.unschedule('ai-live-stream-slicer')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'ai-live-stream-slicer'
);

-- Schedule with new function name
SELECT cron.schedule(
  'ai-live-asset-slicer',
  '*/1 * * * *',  -- Every minute
  'SELECT process_live_asset_segments();'
);

-- Verify the job was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai-live-asset-slicer') THEN
    RAISE NOTICE 'Cron job ai-live-asset-slicer scheduled successfully';
  ELSE
    RAISE EXCEPTION 'Failed to schedule cron job ai-live-asset-slicer';
  END IF;
END $$;

