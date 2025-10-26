"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Camera } from "@/lib/supabase";
import { CameraCard } from "./camera-card";

interface CameraGridProps {
  cameras: Camera[];
  loading: boolean;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CameraGrid({
  cameras,
  loading,
  onRename,
  onDelete,
}: CameraGridProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading cameras...
        </div>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl opacity-20">📹</div>
        <div>
          <h3 className="text-lg font-semibold mb-2">No cameras found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first camera by going to the{" "}
            <a href="/stream" className="text-primary hover:underline">
              Stream page
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Sort cameras: active first, then by last_connected_at
  const sortedCameras = [...cameras].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    const aTime = a.last_connected_at
      ? new Date(a.last_connected_at).getTime()
      : 0;
    const bTime = b.last_connected_at
      ? new Date(b.last_connected_at).getTime()
      : 0;
    return bTime - aTime;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold">Live Cameras</h2>
        <p className="text-sm text-muted-foreground">
          {cameras.filter((c) => c.status === "active").length} of{" "}
          {cameras.length} cameras streaming
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-4">
          {sortedCameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
