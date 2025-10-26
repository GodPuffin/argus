"use client";

import { IconHelpCircle, IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Asset, supabase } from "@/lib/supabase";

interface RecordingInfoModalProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingInfoModal({
  asset,
  open,
  onOpenChange,
}: RecordingInfoModalProps) {
  const [cameraName, setCameraName] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: string | number) => {
    // Handle both ISO strings and Unix timestamps
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

  // Fetch camera name if this recording is from a livestream
  useEffect(() => {
    const fetchCameraName = async () => {
      if (!asset.live_stream_id) return;

      setLoadingCamera(true);
      try {
        const { data, error } = await supabase
          .schema("mux")
          .from("live_streams")
          .select("camera_name, browser_id")
          .eq("id", asset.live_stream_id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching camera info:", error);
          return;
        }

        if (data?.camera_name) {
          setCameraName(data.camera_name);
        }
      } catch (error) {
        console.error("Error fetching camera info:", error);
      } finally {
        setLoadingCamera(false);
      }
    };

    if (open) {
      fetchCameraName();
    }
  }, [asset.live_stream_id, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Recording Details</DialogTitle>
          <DialogDescription>Recording metadata</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Asset ID</p>
                  <p className="font-mono text-xs break-all">{asset.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge
                    variant={asset.status === "ready" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {asset.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="text-xs">
                    {formatDuration(asset.duration_seconds || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium text-xs">
                    {formatDate(asset.created_at)}
                  </p>
                </div>
                {asset.ingest_type && (
                  <div>
                    <p className="text-muted-foreground text-xs">Ingest Type</p>
                    <p className="font-medium text-xs">{asset.ingest_type}</p>
                  </div>
                )}
                {asset.test && (
                  <div>
                    <p className="text-muted-foreground text-xs">Test Asset</p>
                    <Badge variant="outline" className="mt-1">
                      Test
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Livestream Source */}
            {asset.live_stream_id && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Recording Source
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Source Type</p>
                    <Badge
                      variant="outline"
                      className="mt-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                    >
                      Livestream Recording
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Camera</p>
                    {loadingCamera ? (
                      <Spinner variant="circle" className="size-4 mt-1" />
                    ) : cameraName ? (
                      <p className="font-medium text-xs">{cameraName}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Unknown camera
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">
                      Live Stream ID
                    </p>
                    <p className="font-mono text-xs break-all">
                      {asset.live_stream_id}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Quality & Resolution */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-2">
                Video Quality
              </h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {asset.resolution_tier && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Resolution Tier
                    </p>
                    <p className="font-medium">{asset.resolution_tier}</p>
                  </div>
                )}
                {asset.video_quality && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Video Quality
                    </p>
                    <p className="font-medium">{asset.video_quality}</p>
                  </div>
                )}
                {asset.aspect_ratio && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Aspect Ratio
                    </p>
                    <p className="font-medium">{asset.aspect_ratio}</p>
                  </div>
                )}
                {asset.max_stored_frame_rate && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Max Frame Rate
                    </p>
                    <p className="font-medium">
                      {asset.max_stored_frame_rate} fps
                    </p>
                  </div>
                )}
                {asset.max_resolution_tier && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Max Resolution Tier
                    </p>
                    <p className="font-medium">{asset.max_resolution_tier}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Playback IDs */}
            {asset.playback_ids && asset.playback_ids.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Playback IDs
                </h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Playback ID</TableHead>
                        <TableHead>Policy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.playback_ids.map((playback: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">
                            {playback.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                playback.policy === "public"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {playback.policy}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Tracks */}
            {asset.tracks && asset.tracks.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">Tracks</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.tracks.map((track: any) => (
                        <TableRow key={track.id}>
                          <TableCell>
                            <Badge variant="outline">{track.type}</Badge>
                            {track.primary && (
                              <Badge variant="default" className="ml-2">
                                Primary
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {track.max_width && track.max_height && (
                                <p>
                                  {track.max_width}×{track.max_height}
                                </p>
                              )}
                              {track.max_channels && (
                                <p>{track.max_channels} channels</p>
                              )}
                              {track.language_code && (
                                <p>Lang: {track.language_code}</p>
                              )}
                              {track.name && <p>{track.name}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {track.status && (
                              <Badge variant="secondary">{track.status}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Recording Times */}
            {asset.recording_times && asset.recording_times.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Recording Sessions
                </h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Started At</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.recording_times.map(
                        (recording: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">
                              {formatDate(recording.started_at)}
                            </TableCell>
                            <TableCell>
                              {formatDuration(recording.duration)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  recording.type === "content"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {recording.type}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Progress */}
            {asset.progress && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Processing Status
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">State</p>
                    <Badge className="mt-1">{asset.progress.state}</Badge>
                  </div>
                  {asset.progress.progress !== undefined &&
                    asset.progress.progress >= 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Progress
                        </p>
                        <p className="font-medium">
                          {asset.progress.progress}%
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Non-Standard Input Reasons */}
            {asset.non_standard_input_reasons &&
              Object.keys(asset.non_standard_input_reasons).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-2">
                    Non-Standard Input Reasons
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(asset.non_standard_input_reasons).map(
                      ([key, value]: [string, unknown]) => (
                        <div
                          key={key}
                          className="text-sm flex justify-between items-center p-2 bg-muted/50 rounded"
                        >
                          <span className="text-muted-foreground">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Static Renditions */}
            {asset.static_renditions &&
              asset.static_renditions.files &&
              asset.static_renditions.files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-2">
                    Static Renditions
                  </h3>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Resolution</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asset.static_renditions.files.map(
                          (file: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">
                                {file.name}
                              </TableCell>
                              <TableCell className="text-xs">
                                {file.width && file.height
                                  ? `${file.width}×${file.height}`
                                  : file.resolution_tier || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {file.filesize
                                  ? `${(Number.parseInt(file.filesize) / 1024 / 1024).toFixed(2)} MB`
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    file.status === "ready"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {file.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

            {/* Errors */}
            {asset.errors &&
              asset.errors.messages &&
              asset.errors.messages.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-2 text-destructive">
                    Errors
                  </h3>
                  <div className="space-y-2">
                    {asset.errors.type && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Type:</span>{" "}
                        {asset.errors.type}
                      </p>
                    )}
                    {asset.errors.messages.map((message: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-sm p-2 bg-destructive/10 rounded border border-destructive/20"
                      >
                        {message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Additional Metadata */}
            {(asset.meta || asset.passthrough || asset.upload_id) && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Additional Metadata
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {asset.meta?.title && (
                    <div>
                      <p className="text-muted-foreground text-xs">Title</p>
                      <p className="font-medium">{asset.meta.title}</p>
                    </div>
                  )}
                  {asset.meta?.creator_id && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Creator ID
                      </p>
                      <p className="font-mono text-xs">
                        {asset.meta.creator_id}
                      </p>
                    </div>
                  )}
                  {asset.meta?.external_id && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        External ID
                      </p>
                      <p className="font-mono text-xs">
                        {asset.meta.external_id}
                      </p>
                    </div>
                  )}
                  {asset.passthrough && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Passthrough
                      </p>
                      <p className="font-mono text-xs">{asset.passthrough}</p>
                    </div>
                  )}
                  {asset.upload_id && (
                    <div>
                      <p className="text-muted-foreground text-xs">Upload ID</p>
                      <p className="font-mono text-xs break-all">
                        {asset.upload_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Export a trigger button component for convenience
export function RecordingInfoButton({ asset }: { asset: Asset }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        title="View details"
      >
        <IconInfoCircle className="size-4" />
      </Button>
      <RecordingInfoModal asset={asset} open={open} onOpenChange={setOpen} />
    </>
  );
}
