-- Drop the legacy public.cameras view
-- All code now directly uses mux.live_streams table

DROP VIEW IF EXISTS public.cameras CASCADE;

-- This view was created for backward compatibility during the migration
-- from public.cameras table to mux.live_streams table.
-- All application code now uses mux.live_streams directly:
--   - app/api/cameras/* routes
--   - hooks/use-cameras-realtime.ts
--   - lib/elasticsearch-sync.ts

