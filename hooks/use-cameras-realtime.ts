import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useDemoSession } from "@/hooks/use-demo-session";
import { isDemoMode } from "@/lib/demo/flag";
import { mockCameras } from "@/lib/demo/mock-data";
import { type Camera, supabase } from "@/lib/supabase";

export function useCamerasRealtime() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In demo mode there is no backend: layer session-added cameras (from the
  // onboarding overlay) in front of the base mocks and skip the subscription.
  const { cameras: sessionCameras } = useDemoSession();
  const demoCameras = useMemo(
    () => [...sessionCameras, ...mockCameras],
    [sessionCameras],
  );

  useEffect(() => {
    if (isDemoMode) return;

    // Initial fetch from mux.live_streams table
    const fetchCameras = async () => {
      try {
        const { data, error } = await supabase
          .schema("mux")
          .from("live_streams")
          .select("*")
          .not("browser_id", "is", null) // Only get streams with browser_id (our cameras)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCameras(data || []);
      } catch (err) {
        console.error("Error fetching cameras:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch cameras",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();

    // Set up realtime subscription to mux.live_streams
    const channel: RealtimeChannel = supabase
      .channel("live_streams_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "mux",
          table: "live_streams",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newCamera = payload.new as Camera;
            // Only add if it has a browser_id (is a camera)
            if (newCamera.browser_id) {
              setCameras((current) => [newCamera, ...current]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedCamera = payload.new as Camera;
            // Update or remove based on browser_id
            setCameras((current) => {
              if (!updatedCamera.browser_id) {
                // browser_id was removed, filter it out
                return current.filter(
                  (camera) => camera.id !== updatedCamera.id,
                );
              }
              // Update existing camera
              const exists = current.some(
                (camera) => camera.id === updatedCamera.id,
              );
              if (exists) {
                return current.map((camera) =>
                  camera.id === updatedCamera.id ? updatedCamera : camera,
                );
              }
              // Camera was just given a browser_id, add it
              return [updatedCamera, ...current];
            });
          } else if (payload.eventType === "DELETE") {
            setCameras((current) =>
              current.filter((camera) => camera.id !== payload.old.id),
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

  if (isDemoMode) {
    return { cameras: demoCameras, loading: false, error: null };
  }

  return { cameras, loading, error };
}
