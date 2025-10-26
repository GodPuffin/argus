import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { type AIAnalysisEvent, supabase } from "@/lib/supabase";

export function useEventsRealtime(assetId: string | null) {
  const [events, setEvents] = useState<AIAnalysisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // Initial fetch from ai_analysis_events table
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("ai_analysis_events")
          .select("*")
          .eq("asset_id", assetId)
          .order("timestamp_seconds", { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Set up realtime subscription to ai_analysis_events
    const channel: RealtimeChannel = supabase
      .channel(`events_${assetId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "ai_analysis_events",
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => {
          console.log("Event realtime update:", payload);

          if (payload.eventType === "INSERT") {
            const newEvent = payload.new as AIAnalysisEvent;
            setEvents((current) => {
              // Insert in correct order by timestamp
              const updated = [...current, newEvent];
              updated.sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
              return updated;
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedEvent = payload.new as AIAnalysisEvent;
            setEvents((current) =>
              current.map((event) =>
                event.id === updatedEvent.id ? updatedEvent : event,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setEvents((current) =>
              current.filter((event) => event.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [assetId]);

  return { events, loading, error };
}
