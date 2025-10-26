"use client";

import { useEffect, useState } from "react";
import { supabase, type Asset } from "@/lib/supabase";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { IconAlertCircle } from "@tabler/icons-react";
import { RecordingCard } from "@/components/watch/recording-card";
import { Card, CardContent } from "@/components/ui/card";

export interface AssetDisplayProps {
  asset_id: string;
}

export const AssetDisplay = ({ asset_id }: AssetDisplayProps) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .schema("mux")
          .from("assets")
          .select("*")
          .eq("id", asset_id)
          .single();

        if (fetchError) {
          console.error("Error fetching asset:", fetchError);
          setError("Failed to load video");
          return;
        }

        if (!data) {
          setError("Video not found");
          return;
        }

        setAsset(data as Asset);
      } catch (err) {
        console.error("Error fetching asset:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [asset_id]);

  if (loading) {
    return (
      <Card className="not-prose max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <Spinner variant="ring" size={32} className="mx-auto" />
              <p className="text-sm text-muted-foreground">Loading video...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !asset) {
    return (
      <Card className="not-prose max-w-md border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <IconAlertCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{error || "Video not found"}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Unable to load the requested video asset.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="not-prose max-w-md">
      <RecordingCard asset={asset} />
    </div>
  );
};

