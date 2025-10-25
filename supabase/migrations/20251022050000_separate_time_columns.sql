-- Fix Duplicate Job Processing for Live Streams
-- Problem: Same segment can be enqueued as both 'live' (absolute epoch) and 'vod' (relative seconds)
-- Solution: Add normalized time column for deduplication

-- Add column to store relative seconds from asset start (normalized time)
ALTER TABLE public.ai_analysis_jobs
ADD COLUMN IF NOT EXISTS asset_start_seconds INTEGER,
ADD COLUMN IF NOT EXISTS asset_end_seconds INTEGER;

COMMENT ON COLUMN public.ai_analysis_jobs.asset_start_seconds IS 
  'Start time in seconds from asset beginning (0-based). Used for deduplication.';
COMMENT ON COLUMN public.ai_analysis_jobs.asset_end_seconds IS 
  'End time in seconds from asset beginning (0-based). Used for deduplication.';

-- Keep start_epoch/end_epoch for their original purpose:
-- - For 'live' jobs: absolute Unix epochs (program_start_time/program_end_time)
-- - For 'vod' jobs: relative seconds (asset_start_time/asset_end_time)
COMMENT ON COLUMN public.ai_analysis_jobs.start_epoch IS 
  'For live jobs: absolute Unix epoch. For vod jobs: relative seconds from asset start.';
COMMENT ON COLUMN public.ai_analysis_jobs.end_epoch IS 
  'For live jobs: absolute Unix epoch. For vod jobs: relative seconds from asset start.';

-- Drop old unique index
DROP INDEX IF EXISTS ai_jobs_unique_window;

-- Create new unique index on normalized asset times
-- This prevents duplicate processing of the same video segment
CREATE UNIQUE INDEX IF NOT EXISTS ai_jobs_unique_asset_window
  ON public.ai_analysis_jobs (source_id, asset_start_seconds, asset_end_seconds);

-- Backfill existing VOD jobs (start_epoch already contains relative seconds)
UPDATE public.ai_analysis_jobs
SET 
  asset_start_seconds = start_epoch,
  asset_end_seconds = end_epoch
WHERE source_type = 'vod' AND asset_start_seconds IS NULL;

-- Note: Live jobs and new jobs will populate these columns via application code

