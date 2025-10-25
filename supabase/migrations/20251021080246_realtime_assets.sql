-- Enable realtime for the mux.assets table
-- This allows clients to subscribe to INSERT, UPDATE, and DELETE events

-- Enable realtime publication for the assets table
ALTER PUBLICATION supabase_realtime ADD TABLE mux.assets;

-- Ensure the table has a replica identity for updates/deletes
-- This allows Supabase to identify which rows changed
ALTER TABLE mux.assets REPLICA IDENTITY FULL;

