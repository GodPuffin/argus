-- Create cameras table to track browser-based cameras and their Mux streams
CREATE TABLE IF NOT EXISTS public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id TEXT UNIQUE NOT NULL,
  camera_name TEXT NOT NULL DEFAULT 'Unnamed Camera',
  mux_stream_id TEXT UNIQUE NOT NULL,
  stream_key TEXT NOT NULL,
  playback_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on browser_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_cameras_browser_id ON public.cameras(browser_id);

-- Create index on status for filtering active/idle cameras
CREATE INDEX IF NOT EXISTS idx_cameras_status ON public.cameras(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (no auth yet)
CREATE POLICY "Allow all operations on cameras" ON public.cameras
  FOR ALL
  USING (true)
  WITH CHECK (true);

