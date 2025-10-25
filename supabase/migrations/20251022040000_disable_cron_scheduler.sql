-- Disable DB Cron-Based Segmentation
-- The worker now handles live asset segmentation directly
-- This migration unschedules the cron jobs to prevent conflicts

-- Unschedule the asset-based cron job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('ai-live-asset-slicer')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'ai-live-asset-slicer'
  );
  
  IF FOUND THEN
    RAISE NOTICE 'Unscheduled cron job: ai-live-asset-slicer';
  ELSE
    RAISE NOTICE 'Cron job ai-live-asset-slicer not found (already unscheduled or never created)';
  END IF;
END $$;

-- Unschedule the legacy live-stream-based cron job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('ai-live-stream-slicer')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'ai-live-stream-slicer'
  );
  
  IF FOUND THEN
    RAISE NOTICE 'Unscheduled cron job: ai-live-stream-slicer';
  ELSE
    RAISE NOTICE 'Cron job ai-live-stream-slicer not found (already unscheduled or never created)';
  END IF;
END $$;

-- Leave the SQL functions in place (dormant) in case they're useful for debugging
-- They won't be called automatically anymore

-- Comment for documentation
COMMENT ON FUNCTION process_live_asset_segments() IS 
  'DEPRECATED: Live asset segmentation now handled by worker/segment-scheduler.ts. Function left in place for manual debugging only.';

COMMENT ON FUNCTION get_mux_asset_duration(TEXT) IS 
  'DEPRECATED: Duration fetching now handled by worker/segment-scheduler.ts. Function left in place for manual debugging only.';

