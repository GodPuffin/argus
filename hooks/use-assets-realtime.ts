import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { type Asset, supabase } from "@/lib/supabase";

export function useAssetsRealtime() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch from mux.assets table
    const fetchAssets = async () => {
      try {
        const { data, error } = await supabase
          .schema("mux")
          .from("assets")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAssets(data || []);
      } catch (err) {
        console.error("Error fetching assets:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch assets");
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();

    // Set up realtime subscription to mux.assets
    const channel: RealtimeChannel = supabase
      .channel("assets_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "mux",
          table: "assets",
        },
        (payload) => {
          console.log("Asset realtime event:", payload);

          if (payload.eventType === "INSERT") {
            const newAsset = payload.new as Asset;
            setAssets((current) => [newAsset, ...current]);
          } else if (payload.eventType === "UPDATE") {
            const updatedAsset = payload.new as Asset;
            setAssets((current) =>
              current.map((asset) =>
                asset.id === updatedAsset.id ? updatedAsset : asset,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setAssets((current) =>
              current.filter((asset) => asset.id !== payload.old.id),
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

  return { assets, loading, error };
}
