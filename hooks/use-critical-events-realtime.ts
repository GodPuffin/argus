import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { type AIAnalysisEvent, supabase } from "@/lib/supabase";

export function useCriticalEventsRealtime() {
  const [events, setEvents] = useState<AIAnalysisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of recent critical events
    const fetchCriticalEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("ai_analysis_events")
          .select("*")
          .eq("severity", "High")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching critical events:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch critical events",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCriticalEvents();

    // Set up realtime subscription to critical events
    const channel: RealtimeChannel = supabase
      .channel("critical_events_global")
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Only listen for new critical events
          schema: "public",
          table: "ai_analysis_events",
          filter: "severity=eq.High",
        },
        (payload) => {
          console.log("Critical event realtime:", payload);

          const newEvent = payload.new as AIAnalysisEvent;
          setEvents((current) => [newEvent, ...current].slice(0, 20)); // Keep only recent 20
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { events, loading, error };
}
