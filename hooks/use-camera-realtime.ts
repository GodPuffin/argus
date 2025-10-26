import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { type Camera, supabase } from "@/lib/supabase";

/**
 * Hook to subscribe to realtime updates for a specific camera by browser ID
 * Now uses mux.live_streams table for instant status updates from Mux webhooks
 */
export function useCameraRealtime(browserId: string | null) {
  const [camera, setCamera] = useState<Camera | null>(null);

  useEffect(() => {
    if (!browserId) return;

    // Fetch initial camera data from mux.live_streams
    const fetchCamera = async () => {
      try {
        const { data, error } = await supabase
          .schema("mux")
          .from("live_streams")
          .select("*")
          .eq("browser_id", browserId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found" error
          console.error("Error fetching camera:", error);
          return;
        }

        setCamera(data || null);
      } catch (err) {
        console.error("Error fetching camera:", err);
      }
    };

    fetchCamera();

    // Set up realtime subscription for this specific camera
    const channel: RealtimeChannel = supabase
      .channel(`live_stream_${browserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "mux",
          table: "live_streams",
          filter: `browser_id=eq.${browserId}`,
        },
        (payload) => {
          console.log("Camera realtime event:", payload);

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setCamera(payload.new as Camera);
          } else if (payload.eventType === "DELETE") {
            setCamera(null);
          }
        },
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [browserId]);

  return camera;
}
