-- AI Analysis Events Table
-- Stores structured events detected in video analysis with severity, type, and timing information

create table if not exists public.ai_analysis_events (
  id bigserial primary key,
  job_id bigint not null references public.ai_analysis_jobs(id) on delete cascade,
  asset_id text not null references mux.assets(id) on delete cascade,
  name text not null,
  description text not null,
  severity text not null check (severity in ('Minor', 'Medium', 'High')),
  type text not null check (type in (
    'Crime',
    'Medical Emergency',
    'Traffic Incident',
    'Property Damage',
    'Safety Hazard',
    'Suspicious Activity',
    'Normal Activity',
    'Camera Interference'
  )),
  timestamp_seconds integer not null, -- absolute seconds from asset start
  affected_entities jsonb default '[]'::jsonb, -- denormalized entity objects involved in the event
  created_at timestamptz default now() not null
);

-- Index for efficient queries by asset
create index if not exists ai_events_asset_id 
  on public.ai_analysis_events (asset_id);

-- Index for job-related queries
create index if not exists ai_events_job_id 
  on public.ai_analysis_events (job_id);

-- Index for filtering by severity (especially for critical events)
create index if not exists ai_events_severity 
  on public.ai_analysis_events (severity);

-- Index for event type searches
create index if not exists ai_events_type 
  on public.ai_analysis_events (type);

-- Index for temporal queries (finding events in a time range)
create index if not exists ai_events_asset_time 
  on public.ai_analysis_events (asset_id, timestamp_seconds);

-- Composite index for severity + type filtering
create index if not exists ai_events_severity_type 
  on public.ai_analysis_events (severity, type);

-- Enable realtime for live event monitoring
alter publication supabase_realtime add table public.ai_analysis_events;

-- Comments for documentation
comment on table public.ai_analysis_events is 'Structured events detected in video analysis with severity, type, and timing';
comment on column public.ai_analysis_events.asset_id is 'Foreign key to mux.assets - always references the actual asset, even for live-derived jobs';
comment on column public.ai_analysis_events.timestamp_seconds is 'Absolute seconds from asset start (job.asset_start_seconds + event.timestamp_seconds)';
comment on column public.ai_analysis_events.affected_entities is 'Denormalized entity objects involved in this event for easier querying';

