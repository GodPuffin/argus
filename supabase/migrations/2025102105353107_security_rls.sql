-- Permissions for mux schema (NO RLS - demo project)
-- Full public access to all tables for simplicity

-- Grant usage on the mux schema to everyone
GRANT USAGE ON SCHEMA mux TO anon, authenticated, service_role;

-- Grant full permissions to all roles (no restrictions for demo)
GRANT ALL ON ALL TABLES IN SCHEMA mux TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mux GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Disable RLS on all Mux tables (not needed for demo)
ALTER TABLE "mux"."assets"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE "mux"."live_streams"    DISABLE ROW LEVEL SECURITY;
ALTER TABLE "mux"."uploads"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "mux"."webhook_events"  DISABLE ROW LEVEL SECURITY;