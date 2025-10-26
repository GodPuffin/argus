import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { type Report, supabase } from "@/lib/supabase";

export function useReportsRealtime() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch from reports table
    const fetchReports = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("reports")
          .select("*")
          .order("updated_at", { ascending: false });

        if (fetchError) throw fetchError;
        setReports(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch reports",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    // Set up realtime subscription to reports
    const channel: RealtimeChannel = supabase
      .channel("reports_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "reports",
        },
        (payload) => {
          console.log("Report realtime event:", payload);

          if (payload.eventType === "INSERT") {
            const newReport = payload.new as Report;
            setReports((current) => [newReport, ...current]);
          } else if (payload.eventType === "UPDATE") {
            const updatedReport = payload.new as Report;
            setReports((current) => {
              const updated = current.map((report) =>
                report.id === updatedReport.id ? updatedReport : report,
              );
              // Re-sort by updated_at
              return updated.sort(
                (a, b) =>
                  new Date(b.updated_at).getTime() -
                  new Date(a.updated_at).getTime(),
              );
            });
          } else if (payload.eventType === "DELETE") {
            setReports((current) =>
              current.filter((report) => report.id !== payload.old.id),
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

  return { reports, loading, error };
}
