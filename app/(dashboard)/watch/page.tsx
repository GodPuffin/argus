"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { BrailleLoader } from "@/components/braille-loader";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SiteHeader } from "@/components/site-header";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { CameraGrid } from "@/components/watch/camera-grid";
import { FirstRunNextStepsCard } from "@/components/watch/first-run-next-steps-card";
import { RecordingGrid } from "@/components/watch/recording-grid";
import { useAssetsRealtime } from "@/hooks/use-assets-realtime";
import { useCamerasRealtime } from "@/hooks/use-cameras-realtime";
import { useDemoSession } from "@/hooks/use-demo-session";
import { isDemoMode } from "@/lib/demo/flag";
import { removeCamera, renameCamera } from "@/lib/demo/session-store";

const WATCH_TAB_STORAGE_KEY = "watch-last-tab";
const WATCH_NEXT_STEPS_SEEN_KEY = "argus.demo.watch.nextStepsSeen.v1";

function WatchContent() {
  const searchParams = useSearchParams();

  const { cameras, loading: loadingCameras } = useCamerasRealtime();
  const { assets, loading: loadingAssets } = useAssetsRealtime();
  const session = useDemoSession();

  const [activeTab, setActiveTab] = useState<string>("cameras");
  const [showNextSteps, setShowNextSteps] = useState(false);

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

  useEffect(() => {
    if (!session.onboardingComplete) {
      setShowNextSteps(false);
      return;
    }
    setShowNextSteps(!localStorage.getItem(WATCH_NEXT_STEPS_SEEN_KEY));
  }, [session.onboardingComplete]);

  const handleTabChange = (tab: string) => {
    // Map display name to internal value
    const value = tab === "Live Cameras" ? "cameras" : "recordings";
    setActiveTab(value);
    localStorage.setItem(WATCH_TAB_STORAGE_KEY, value);
  };

  const dismissNextSteps = () => {
    localStorage.setItem(WATCH_NEXT_STEPS_SEEN_KEY, "true");
    setShowNextSteps(false);
  };

  const openRecordings = () => {
    setActiveTab("recordings");
    localStorage.setItem(WATCH_TAB_STORAGE_KEY, "recordings");
  };

  const handleRenameCamera = async (cameraId: string, newName: string) => {
    // Session-added cameras live in the client overlay, not the backend.
    if (isDemoMode && cameraId.startsWith("session-cam-")) {
      renameCamera(cameraId, newName);
      return;
    }
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
      toast.error("Failed to update camera name");
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (isDemoMode && cameraId.startsWith("session-cam-")) {
      removeCamera(cameraId);
      return;
    }
    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete camera");
      }
    } catch (error) {
      console.error("Error deleting camera:", error);
      toast.error("Failed to delete camera");
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
      toast.error("Failed to update recording");
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
      toast.error("Failed to delete recording");
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <SiteHeader title="Watch" />
      <PageContainer>
        <PageHeader
          title="Watch"
          description="Live cameras and recordings from every connected stream."
        />
        {showNextSteps && (
          <FirstRunNextStepsCard
            onDismiss={dismissNextSteps}
            onOpenRecordings={openRecordings}
          />
        )}
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
      </PageContainer>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col min-h-0">
          <SiteHeader title="Watch" />
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <BrailleLoader className="text-3xl font-mono" />
              <p className="text-sm">
                Loading watch...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
