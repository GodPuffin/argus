-- Object Detection Tables
-- Stores YOLOv8 detection results for video segments

-- AI Object Detections Table
-- Each row represents detections found in a single frame
create table if not exists public.ai_object_detections (
  id bigserial primary key,
  job_id bigint not null references public.ai_analysis_jobs(id) on delete cascade,
  frame_timestamp numeric(10, 3) not null, -- Relative seconds within segment (e.g., 0.500, 1.000)
  frame_index int not null, -- Frame number in sequence
  detections jsonb default '[]'::jsonb not null, -- Array of {class, confidence, bbox: {x, y, width, height}}
  created_at timestamptz default now() not null
);

-- Unique constraint ensures no duplicate frames per job
create unique index if not exists ai_object_detections_unique_frame
  on public.ai_object_detections (job_id, frame_timestamp);

-- Index for efficient time-range queries
create index if not exists ai_object_detections_job_time
  on public.ai_object_detections (job_id, frame_timestamp);

-- Index for querying by job
create index if not exists ai_object_detections_job
  on public.ai_object_detections (job_id);

-- Enable realtime for detection monitoring (optional)
-- alter publication supabase_realtime add table public.ai_object_detections;

-- Comments for documentation
comment on table public.ai_object_detections is 'YOLOv8 object detection results per video frame';
comment on column public.ai_object_detections.frame_timestamp is 'Relative seconds from start of segment (0-60)';
comment on column public.ai_object_detections.detections is 'Array of detected objects with normalized bounding boxes (0-1 coordinates)';

