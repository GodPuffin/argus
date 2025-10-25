-- AI Analysis Workflow Tables
-- Stores jobs for AI analysis of video segments and their results

-- Add last_processed_epoch to mux.live_streams for scheduling state
alter table mux.live_streams 
add column if not exists last_processed_epoch bigint;

-- AI Analysis Jobs Table
-- Each job represents a 60-second segment to be analyzed
create table if not exists public.ai_analysis_jobs (
  id bigserial primary key,
  source_type text check (source_type in ('vod','live')) not null,
  source_id text not null, -- asset_id or live_stream_id
  playback_id text not null,
  start_epoch bigint not null, -- Unix epoch timestamp
  end_epoch bigint not null,   -- Unix epoch timestamp
  status text default 'queued' check (status in ('queued','processing','succeeded','failed','dead')) not null,
  attempts int default 0 not null,
  error text,
  result_ref bigint,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Unique constraint ensures idempotency - same segment won't be processed twice
create unique index if not exists ai_jobs_unique_window 
  on public.ai_analysis_jobs (source_id, start_epoch, end_epoch);

-- Index for efficient job queue polling
create index if not exists ai_jobs_status_created 
  on public.ai_analysis_jobs (status, created_at) 
  where status in ('queued', 'processing');

-- Index for source lookups
create index if not exists ai_jobs_source 
  on public.ai_analysis_jobs (source_type, source_id);

-- AI Analysis Results Table
-- Stores the structured results from Gemini analysis
create table if not exists public.ai_analysis_results (
  job_id bigint primary key references public.ai_analysis_jobs(id) on delete cascade,
  summary text,
  tags jsonb default '[]'::jsonb,
  entities jsonb default '[]'::jsonb,
  transcript_ref text,
  embeddings_ref text,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Update timestamp trigger for ai_analysis_jobs
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ai_analysis_jobs_updated_at
  before update on public.ai_analysis_jobs
  for each row
  execute function update_updated_at_column();

-- Enable realtime for job status monitoring (optional)
-- alter publication supabase_realtime add table public.ai_analysis_jobs;
-- alter publication supabase_realtime add table public.ai_analysis_results;

-- Comments for documentation
comment on table public.ai_analysis_jobs is 'Queue of 60-second video segments to be analyzed by Gemini';
comment on table public.ai_analysis_results is 'Structured results from Gemini multimodal analysis';
comment on column mux.live_streams.last_processed_epoch is 'Unix epoch of the last minute analyzed for live streams';

