-- Enable realtime for AI analysis jobs table
-- This allows the UI to receive live updates as jobs are processed

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_analysis_jobs;

COMMENT ON TABLE public.ai_analysis_jobs IS 'AI analysis jobs queue with realtime updates enabled';

