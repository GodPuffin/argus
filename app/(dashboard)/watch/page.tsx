"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CameraGrid } from "@/components/watch/camera-grid"
import { RecordingGrid } from "@/components/watch/recording-grid"
import { useCamerasRealtime } from "@/hooks/use-cameras-realtime"
import { useAssetsRealtime } from "@/hooks/use-assets-realtime"

const WATCH_TAB_STORAGE_KEY = "watch-last-tab";

export default function WatchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Use realtime hooks - no more manual polling!
  const { cameras, loading: loadingCameras } = useCamerasRealtime();
  const { assets, loading: loadingAssets } = useAssetsRealtime();
  
  // Tab persistence with URL param override
  const [activeTab, setActiveTab] = useState<string>("cameras");
  
  // Initialize tab from URL param or localStorage
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && (urlTab === "cameras" || urlTab === "recordings")) {
      setActiveTab(urlTab);
      // Save to localStorage
      localStorage.setItem(WATCH_TAB_STORAGE_KEY, urlTab);
    } else {
      // Read from localStorage
      const savedTab = localStorage.getItem(WATCH_TAB_STORAGE_KEY);
      if (savedTab && (savedTab === "cameras" || savedTab === "recordings")) {
        setActiveTab(savedTab);
      }
    }
  }, [searchParams]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Save to localStorage
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
      
      // No need to manually refresh - realtime will update automatically!
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
      
      // No need to manually refresh - realtime will update automatically!
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

      // No need to manually refresh - realtime will update automatically!
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

      // No need to manually refresh - realtime will update automatically!
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete recording");
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SiteHeader title="Watch" />
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1 overflow-hidden">
          <TabsList>
            <TabsTrigger value="cameras">Live Cameras</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value="cameras" className="flex-1 mt-4 overflow-hidden">
            <CameraGrid
              cameras={cameras}
              loading={loadingCameras}
              onRename={handleRenameCamera}
              onDelete={handleDeleteCamera}
            />
          </TabsContent>

          <TabsContent value="recordings" className="flex-1 mt-4 overflow-hidden">
            <RecordingGrid
              assets={assets}
              loading={loadingAssets}
              onUpdate={handleUpdateAsset}
              onDelete={handleDeleteAsset}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

