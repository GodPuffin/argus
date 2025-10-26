"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { CameraGrid } from "@/components/watch/camera-grid"
import { RecordingGrid } from "@/components/watch/recording-grid"
import { useCamerasRealtime } from "@/hooks/use-cameras-realtime"
import { useAssetsRealtime } from "@/hooks/use-assets-realtime"

const WATCH_TAB_STORAGE_KEY = "watch-last-tab";

export default function WatchPage() {
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

  const handleUpdateAsset = async (assetId: string, updates: { passthrough?: string; meta?: any }) => {
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

