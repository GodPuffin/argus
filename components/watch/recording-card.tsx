"use client";

import MuxPlayer from "@mux/mux-player-react/lazy";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "@mux/mux-player/themes/minimal";
import getBlurUp from "@mux/blurup";
import { IconTrash } from "@tabler/icons-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LuxeCard as Card,
  LuxeCardContent as CardContent,
} from "@/components/ui/luxe-card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  type AIAnalysisJob,
  type Asset,
  getAssetPlaybackId,
  supabase,
} from "@/lib/supabase";
import { RecordingInfoButton } from "./recording-info-modal";

interface RecordingCardProps {
  asset: Asset;
  onUpdate?: (
    assetId: string,
    updates: { passthrough?: string; meta?: any },
  ) => Promise<void>;
  onDelete?: (assetId: string) => Promise<void>;
}

export function RecordingCard({
  asset,
  onUpdate,
  onDelete,
}: RecordingCardProps) {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blurUpUrl, setBlurUpUrl] = useState<string | undefined>(undefined);
  const [activeJob, setActiveJob] = useState<AIAnalysisJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const playerRef = useRef<any>(null);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: string | number) => {
    const date =
      typeof timestamp === "string" && timestamp.includes("-")
        ? new Date(timestamp)
        : new Date(
            typeof timestamp === "string"
              ? parseInt(timestamp) * 1000
              : timestamp * 1000,
          );
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: string | number) => {
    const date =
      typeof timestamp === "string" && timestamp.includes("-")
        ? new Date(timestamp)
        : new Date(
            typeof timestamp === "string"
              ? parseInt(timestamp) * 1000
              : timestamp * 1000,
          );
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

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    setDeleteDialogOpen(false);
    await onDelete(asset.id);
  };

  const handleCardClick = () => {
    router.push(`/watch/${asset.id}`);
  };

  const playbackId = getAssetPlaybackId(asset);

  useEffect(() => {
    if (!playbackId) return;

    const generateBlurUp = async () => {
      try {
        let width = 16;
        let height = 9;

        if (asset.aspect_ratio) {
          const [w, h] = asset.aspect_ratio.split(":").map(Number);
          if (w && h) {
            width = w;
            height = h;
          }
        }

        const { blurDataURL } = await getBlurUp(playbackId, {
          time: 0,
          width,
          height,
        });
        setBlurUpUrl(blurDataURL);
      } catch (error) {
        console.error("Failed to generate blur-up:", error);
        const aspectRatio = asset.aspect_ratio || "16:9";
        const [w, h] = aspectRatio.split(":").map(Number);
        setBlurUpUrl(
          `https://image.mux.com/${playbackId}/thumbnail.webp?width=${w || 16}&height=${h || 9}&time=0`,
        );
      }
    };

    generateBlurUp();
  }, [playbackId, asset.aspect_ratio]);

  useEffect(() => {
    const fetchActiveJob = async () => {
      try {
        setLoadingJob(true);
        const { data, error } = await supabase
          .from("ai_analysis_jobs")
          .select("*")
          .eq("source_id", asset.id)
          .in("status", ["queued", "processing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching active job:", error);
          setLoadingJob(false);
          return;
        }

        setActiveJob(data as AIAnalysisJob | null);
      } catch (err) {
        console.error("Failed to fetch active job:", err);
      } finally {
        setLoadingJob(false);
      }
    };

    fetchActiveJob();

    const channel = supabase
      .channel(`job-updates-${asset.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_analysis_jobs",
          filter: `source_id=eq.${asset.id}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const job = payload.new as AIAnalysisJob;
            if (job.status === "queued" || job.status === "processing") {
              setActiveJob(job);
            } else {
              setActiveJob(null);
            }
          } else if (payload.eventType === "DELETE") {
            setActiveJob(null);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [asset.id]);

  return (
    <>
      <Card
        variant="revealed-pointer"
        className="group relative overflow-hidden transition-all hover:shadow-lg py-0"
      >
        <CardContent className="p-0 pb-4">
          {/* Video Display */}
          <div
            className="relative aspect-video bg-black mb-3"
            onClick={(e) => e.stopPropagation()}
          >
            {hasError || asset.status === "errored" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground p-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Video Unavailable</p>
                  <p className="text-xs mt-1">
                    {asset.status === "errored"
                      ? "Processing failed"
                      : "This recording cannot be played"}
                  </p>
                </div>
              </div>
            ) : asset.status === "ready" && playbackId ? (
              <MuxPlayer
                theme="minimal"
                ref={playerRef}
                playbackId={playbackId}
                placeholder={blurUpUrl}
                loading="viewport"
                streamType="on-demand"
                disableTracking={true}
                disableCookies={true}
                style={
                  {
                    aspectRatio: "16/9",
                    width: "100%",
                    "--fullscreen-button": "none",
                  } as React.CSSProperties
                }
                className="w-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground p-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Processing</p>
                  <p className="text-xs mt-1">Video is being prepared</p>
                </div>
              </div>
            )}
          </div>

          {/* Recording Info */}
          <div
            className="px-4 space-y-3 cursor-pointer"
            onClick={handleCardClick}
          >
            {/* {asset.meta?.title && (
              <h3 className="font-semibold truncate text-sm mb-1">{asset.meta.title}</h3>
            )} */}

            {/* Time/Quality and Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(asset.duration_seconds || 0)}
                  </span>
                  {asset.max_resolution_tier && (
                    <span className="text-sm text-muted-foreground">
                      {asset.max_resolution_tier}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(asset.created_at)}
                </p>
              </div>

              {/* Action Buttons */}
              <div
                className="flex gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <RecordingInfoButton asset={asset} />

                <AlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={isDeleting}
                      title="Delete recording"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isDeleting ? (
                        <Spinner variant="circle" className="size-4" />
                      ) : (
                        <IconTrash className="size-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recording</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "
                        {asset.meta?.title || asset.id}"? This will permanently
                        delete the asset and cannot be undone.
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

            {/* Status Indicator */}
            <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    loadingJob
                      ? "bg-gray-400"
                      : activeJob
                        ? "bg-blue-500"
                        : asset.status === "ready"
                          ? "bg-green-500"
                          : asset.status === "errored"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                  }`}
                />
                <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  {loadingJob ? (
                    <>
                      <Spinner variant="circle" className="size-3" />
                      Loading...
                    </>
                  ) : activeJob ? (
                    <>
                      <Spinner variant="circle" className="size-3" />
                      {activeJob.status === "processing"
                        ? "Analyzing"
                        : "Queued for Analysis"}
                    </>
                  ) : asset.status === "ready" ? (
                    "Ready to play"
                  ) : asset.status === "preparing" ? (
                    "Processing"
                  ) : asset.status === "errored" ? (
                    "Error"
                  ) : (
                    asset.status
                  )}
                </span>
              </div>
              {asset.is_live && (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-xs h-5"
                >
                  Currently Live
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
