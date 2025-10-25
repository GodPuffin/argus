-- Fix Live Asset Processing to Fetch Live Duration from Mux API
-- The duration_seconds column only updates on webhooks, so we need to fetch it from Mux API
-- for live assets

-- Create function to fetch asset duration from Mux API
CREATE OR REPLACE FUNCTION get_mux_asset_duration(asset_id TEXT)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mux_token_id TEXT;
  mux_token_secret TEXT;
  api_url TEXT;
  api_response TEXT;
  duration_value DECIMAL;
BEGIN
  -- Get Mux credentials from environment
  SELECT decrypted_secret INTO mux_token_id 
  FROM vault.decrypted_secrets 
  WHERE name = 'MUX_TOKEN_ID';
  
  SELECT decrypted_secret INTO mux_token_secret 
  FROM vault.decrypted_secrets 
  WHERE name = 'MUX_TOKEN_SECRET';
  
  IF mux_token_id IS NULL OR mux_token_secret IS NULL THEN
    RAISE NOTICE 'Mux credentials not found in vault, falling back to database value';
    RETURN NULL;
  END IF;
  
  -- Call Mux API to get current asset info
  api_url := 'https://api.mux.com/video/v1/assets/' || asset_id;
  
  -- Use http extension to make API call
  SELECT (content::json->'data'->>'duration')::DECIMAL
  INTO duration_value
  FROM http((
    'GET',
    api_url,
    ARRAY[http_header('Authorization', 'Basic ' || encode((mux_token_id || ':' || mux_token_secret)::bytea, 'base64'))],
    NULL,
    NULL
  )::http_request);
  
  RETURN duration_value;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fetching duration from Mux API: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Update the asset processing function to fetch live duration
CREATE OR REPLACE FUNCTION process_live_asset_segments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  asset_record RECORD;
  window_size INT := 60;
  asset_duration INT;
  db_duration INT;
  live_duration DECIMAL;
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
      playback_ids,
      status
    FROM mux.assets
    WHERE live_stream_id IS NOT NULL
      AND (ai_analysis_complete = false OR ai_analysis_complete IS NULL)
  LOOP
    -- Skip if not ready
    IF asset_record.status != 'ready' THEN
      RAISE NOTICE 'Asset % not ready (status=%), skipping', asset_record.id, asset_record.status;
      CONTINUE;
    END IF;
    
    -- Skip if no playback IDs
    IF jsonb_array_length(asset_record.playback_ids) = 0 THEN
      RAISE NOTICE 'Asset % has no playback_ids, skipping', asset_record.id;
      CONTINUE;
    END IF;
    
    playback_id := asset_record.playback_ids->0->>'id';
    db_duration := asset_record.duration;
    
    -- For live assets, fetch current duration from Mux API
    IF asset_record.is_live = true THEN
      live_duration := get_mux_asset_duration(asset_record.id);
      
      IF live_duration IS NOT NULL THEN
        asset_duration := FLOOR(live_duration)::INT;
        RAISE NOTICE 'Asset % (LIVE): DB duration=%ss, Live duration=%ss', 
          asset_record.id, db_duration, asset_duration;
      ELSE
        -- Fall back to DB duration if API call fails
        asset_duration := db_duration;
        RAISE NOTICE 'Asset % (LIVE): Using DB duration=%ss (API call failed)', 
          asset_record.id, asset_duration;
      END IF;
    ELSE
      asset_duration := db_duration;
      RAISE NOTICE 'Asset % (COMPLETED): duration=%ss', 
        asset_record.id, asset_duration;
    END IF;
    
    -- Calculate how many complete 60-second windows exist
    num_complete_windows := FLOOR(asset_duration / window_size);
    
    IF num_complete_windows = 0 THEN
      RAISE NOTICE 'Asset % only has % seconds, no complete windows yet', 
        asset_record.id, asset_duration;
      CONTINUE;
    END IF;
    
    -- Enqueue jobs for each complete window that doesn't exist yet
    FOR i IN 0..(num_complete_windows - 1) LOOP
      window_start := i * window_size;
      window_end := (i + 1) * window_size;
      
      -- Check if this window already exists
      SELECT COUNT(*) INTO existing_count
      FROM public.ai_analysis_jobs
      WHERE source_id = asset_record.id
        AND source_type = 'vod'
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
          'vod',
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

-- Enable http extension if not already enabled (needed for API calls)
CREATE EXTENSION IF NOT EXISTS http;

-- Comment
COMMENT ON FUNCTION get_mux_asset_duration(TEXT) IS 'Fetches current duration from Mux API for live assets';
COMMENT ON FUNCTION process_live_asset_segments() IS 'Processes live stream assets, fetching current duration from Mux API for is_live=true assets';

