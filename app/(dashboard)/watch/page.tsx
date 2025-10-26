"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { CameraGrid } from "@/components/watch/camera-grid";
import { RecordingGrid } from "@/components/watch/recording-grid";
import { useAssetsRealtime } from "@/hooks/use-assets-realtime";
import { useCamerasRealtime } from "@/hooks/use-cameras-realtime";

const WATCH_TAB_STORAGE_KEY = "watch-last-tab";

function WatchContent() {
  const searchParams = useSearchParams();

  const { cameras, loading: loadingCameras } = useCamerasRealtime();
  const { assets, loading: loadingAssets } = useAssetsRealtime();

  const [activeTab, setActiveTab] = useState<string>("cameras");

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && (urlTab === "cameras" || urlTab === "recordings")) {
      setActiveTab(urlTab);
      localStorage.setItem(WATCH_TAB_STORAGE_KEY, urlTab);
    } else {
      const savedTab = localStorage.getItem(WATCH_TAB_STORAGE_KEY);
      if (savedTab && (savedTab === "cameras" || savedTab === "recordings")) {
        setActiveTab(savedTab);
      }
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    // Map display name to internal value
    const value = tab === "Live Cameras" ? "cameras" : "recordings";
    setActiveTab(value);
    localStorage.setItem(WATCH_TAB_STORAGE_KEY, value);
  };

  const handleRenameCamera = async (cameraId: string, newName: string) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cameraName: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update camera name");
      }
    } catch (error) {
      console.error("Error updating camera:", error);
      alert("Failed to update camera name");
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete camera");
      }
    } catch (error) {
      console.error("Error deleting camera:", error);
      alert("Failed to delete camera");
    }
  };

  const handleUpdateAsset = async (
    assetId: string,
    updates: { passthrough?: string; meta?: any },
  ) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update asset");
      }
    } catch (error) {
      console.error("Error updating asset:", error);
      alert("Failed to update recording");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete recording");
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <SiteHeader title="Watch" />
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 min-h-0">
        <div className="flex flex-col flex-1 min-h-0">
          <AnimatedTabs
            tabs={["Live Cameras", "Recordings"]}
            activeTab={activeTab === "cameras" ? "Live Cameras" : "Recordings"}
            onTabChange={handleTabChange}
          />

          <div className="flex-1 mt-4 min-h-0">
            {activeTab === "cameras" ? (
              <CameraGrid
                cameras={cameras}
                loading={loadingCameras}
                onRename={handleRenameCamera}
                onDelete={handleDeleteCamera}
              />
            ) : (
              <RecordingGrid
                assets={assets}
                loading={loadingAssets}
                onUpdate={handleUpdateAsset}
                onDelete={handleDeleteAsset}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col min-h-0">
        <SiteHeader title="Watch" />
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading watch...</p>
          </div>
        </div>
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
