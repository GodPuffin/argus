import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { type AIAnalysisJob, supabase } from "@/lib/supabase";

export function useJobsRealtime() {
  const [jobs, setJobs] = useState<AIAnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch from ai_analysis_jobs table
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from("ai_analysis_jobs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setJobs(data || []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Set up realtime subscription to ai_analysis_jobs
    const channel: RealtimeChannel = supabase
      .channel("ai_jobs_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "ai_analysis_jobs",
        },
        (payload) => {
          console.log("Job realtime event:", payload);

          if (payload.eventType === "INSERT") {
            const newJob = payload.new as AIAnalysisJob;
            setJobs((current) => [newJob, ...current]);
          } else if (payload.eventType === "UPDATE") {
            const updatedJob = payload.new as AIAnalysisJob;
            setJobs((current) =>
              current.map((job) =>
                job.id === updatedJob.id ? updatedJob : job,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setJobs((current) =>
              current.filter((job) => job.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { jobs, loading, error };
}
