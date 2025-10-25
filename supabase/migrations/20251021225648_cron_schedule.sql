-- Schedule Cron Job for Live Stream Segment Processing
-- This migration creates a cron job that calls a database function every minute
-- The database function processes active live streams and enqueues analysis jobs

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a database function that processes live streams
-- This runs directly in the database, no Edge Function invocation needed!
CREATE OR REPLACE FUNCTION process_live_stream_segments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stream_record RECORD;
  now_epoch BIGINT;
  window_size INT := 60;
  last_processed BIGINT;
  v_start_epoch BIGINT;
  v_end_epoch BIGINT;
  gap_start BIGINT;
  gap_end BIGINT;
BEGIN
  now_epoch := EXTRACT(EPOCH FROM NOW())::BIGINT;
  
  -- Process all active live streams
  FOR stream_record IN 
    SELECT id, playback_ids, last_processed_epoch
    FROM mux.live_streams
    WHERE status = 'active'
  LOOP
    -- Get the first playback_id
    IF jsonb_array_length(stream_record.playback_ids) = 0 THEN
      RAISE NOTICE 'Stream % has no playback_ids, skipping', stream_record.id;
      CONTINUE;
    END IF;
    
    last_processed := COALESCE(stream_record.last_processed_epoch, now_epoch - window_size);
    
    -- Gap fill: enqueue any missed windows
    IF now_epoch - last_processed > window_size THEN
      gap_start := last_processed;
      WHILE gap_start + window_size <= now_epoch LOOP
        gap_end := gap_start + window_size;
        
        -- Insert job if it doesn't exist
        INSERT INTO public.ai_analysis_jobs (
          source_type, source_id, playback_id, 
          start_epoch, end_epoch, status
        )
        VALUES (
          'live',
          stream_record.id,
          stream_record.playback_ids->0->>'id',
          gap_start,
          gap_end,
          'queued'
        )
        ON CONFLICT (source_id, start_epoch, end_epoch) DO NOTHING;
        
        gap_start := gap_end;
      END LOOP;
      
      RAISE NOTICE 'Gap-filled % windows for stream %', 
        (now_epoch - last_processed) / window_size, stream_record.id;
    END IF;
    
    -- Enqueue current window: [now - 60, now)
    v_start_epoch := now_epoch - window_size;
    v_end_epoch := now_epoch;
    
    INSERT INTO public.ai_analysis_jobs (
      source_type, source_id, playback_id,
      start_epoch, end_epoch, status
    )
    VALUES (
      'live',
      stream_record.id,
      stream_record.playback_ids->0->>'id',
      v_start_epoch,
      v_end_epoch,
      'queued'
    )
    ON CONFLICT (source_id, start_epoch, end_epoch) DO NOTHING;
    
    -- Update last_processed_epoch
    UPDATE mux.live_streams
    SET last_processed_epoch = v_end_epoch
    WHERE id = stream_record.id;
    
    RAISE NOTICE 'Processed stream % at epoch %', stream_record.id, now_epoch;
  END LOOP;
  
  RAISE NOTICE 'Live stream segment processing complete';
END;
$$;

-- Grant execute permission to authenticated users (optional, depends on your security needs)
-- GRANT EXECUTE ON FUNCTION process_live_stream_segments() TO authenticated;

-- Unschedule job if it already exists (for idempotent migrations)
DO $$
BEGIN
  PERFORM cron.unschedule('ai-live-stream-slicer')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'ai-live-stream-slicer'
  );
END $$;

-- Schedule the database function to run every minute
SELECT cron.schedule(
  'ai-live-stream-slicer',           -- Job name
  '*/1 * * * *',                      -- Every minute (cron syntax)
  'SELECT process_live_stream_segments();'
);

-- Verify the job was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai-live-stream-slicer') THEN
    RAISE NOTICE 'Cron job ai-live-stream-slicer scheduled successfully';
  ELSE
    RAISE EXCEPTION 'Failed to schedule cron job ai-live-stream-slicer';
  END IF;
END $$;

