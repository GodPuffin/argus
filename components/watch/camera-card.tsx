"use client";

import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { IconPencil, IconTrash, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { LuxeCard as Card, LuxeCardContent as CardContent } from "@/components/ui/luxe-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type Camera, getPlaybackId } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CameraCardProps {
  camera: Camera;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CameraCard({ camera, onRename, onDelete }: CameraCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(camera.camera_name);
  const [isMuted, setIsMuted] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = async () => {
    if (editName.trim() && editName !== camera.camera_name) {
      await onRename(camera.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteDialogOpen(false);
    await onDelete(camera.id);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card variant="revealed-pointer" className="group relative overflow-hidden transition-all hover:shadow-lg py-0">
      <CardContent className="p-0 pb-4">
        {/* Video/Offline Display */}
        <div className="relative aspect-video bg-black mb-3">
          {camera.status === "active" && getPlaybackId(camera) ? (
            <>
              <MuxPlayer
                key={`${camera.id}-${camera.status}`} // Force remount on status change
                playbackId={getPlaybackId(camera) || ""}
                streamType="live"
                muted={isMuted}
                autoPlay
                disableTracking={true}
                disableCookies={true}
                style={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "16/9",
                  "--controls": "none",
                } as React.CSSProperties}
                className="absolute inset-0"
              />
              {/* Minimal Controls Overlay */}
              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-black/70 hover:bg-black/90"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <IconVolumeOff className="size-4" />
                  ) : (
                    <IconVolume className="size-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center space-y-2">
                <div className="text-4xl opacity-20">📹</div>
                <p className="text-sm font-medium text-muted-foreground">
                  {camera.camera_name} is {camera.status === "idle" ? "idle" : "offline"}
                </p>
                {camera.status === "idle" && (
                  <p className="text-xs text-muted-foreground/70">
                    Waiting for stream...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Camera Info & Actions */}
        <div className="px-4 space-y-3">
          {/* Name & Edit */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setEditName(camera.camera_name);
                    setIsEditing(false);
                  }
                }}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditName(camera.camera_name);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{camera.camera_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {camera.status === "active" 
                    ? "Streaming now" 
                    : camera.last_connected_at 
                      ? `Last seen ${formatDate(camera.last_connected_at)}`
                      : "Never connected"
                  }
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                  title="Rename"
                >
                  <IconPencil className="size-4" />
                </Button>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={camera.status === "active" || isDeleting}
                      title={camera.status === "active" ? "Cannot delete while streaming" : "Delete"}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Camera</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{camera.camera_name}"? This will permanently delete the stream and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <div className={`w-2 h-2 rounded-full ${camera.status === "active" ? "bg-green-500 animate-pulse" : camera.status === "idle" ? "bg-yellow-500" : "bg-muted-foreground/30"}`} />
            <span className="text-xs text-muted-foreground capitalize">
              {camera.status === "active" ? "Broadcasting" : camera.status === "idle" ? "Idle" : camera.status}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

