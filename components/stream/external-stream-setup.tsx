"use client";

import { useEffect, useState } from "react";
import { IconCopy, IconCheck, IconVideo } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ExternalStreamSetupProps {
  streamKey: string;
  streamId: string;
  loadingStream: boolean;
  streamError: string;
  onRetryStream: () => void;
}

export function ExternalStreamSetup({
  streamKey,
  streamId,
  loadingStream,
  streamError,
  onRetryStream,
}: ExternalStreamSetupProps) {
  const [streamStatus, setStreamStatus] = useState<"idle" | "active" | "disabled">("idle");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

  const rtmpUrl = "rtmps://global-live.mux.com:443/app";
  const srtUrl = `srt://global-live.mux.com:10000?streamid=${streamKey}`;
  const fullRtmpUrl = `${rtmpUrl}/${streamKey}`;

  // Subscribe to stream status changes via Supabase Realtime
  useEffect(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`stream_status_${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "mux",
          table: "live_streams",
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as "idle" | "active" | "disabled";
          const newProtocol = payload.new.active_ingest_protocol as string | null;
          
          console.log("Stream status update:", newStatus, "Protocol:", newProtocol);
          setStreamStatus(newStatus);
          setActiveProtocol(newProtocol);

          // Show toast notification on status change
          if (newStatus === "active" && streamStatus !== "active") {
            toast.success("Stream connected!", {
              description: `Broadcasting via ${newProtocol?.toUpperCase() || "external software"}`,
            });
          } else if (newStatus === "idle" && streamStatus === "active") {
            toast.info("Stream disconnected", {
              description: "Waiting for reconnection...",
            });
          }
        }
      )
      .subscribe();

    // Fetch initial status
    const fetchInitialStatus = async () => {
      const { data, error } = await supabase
        .schema("mux")
        .from("live_streams")
        .select("status, active_ingest_protocol")
        .eq("id", streamId)
        .single();

      if (data && !error) {
        setStreamStatus(data.status as "idle" | "active" | "disabled");
        setActiveProtocol(data.active_ingest_protocol);
      }
    };

    fetchInitialStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, streamStatus]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="shrink-0"
    >
      {copiedField === field ? (
        <IconCheck className="size-4" />
      ) : (
        <IconCopy className="size-4" />
      )}
    </Button>
  );

  const getStatusIndicator = () => {
    if (streamStatus === "active") {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">Streaming Active</span>
          {activeProtocol && (
            <span className="text-muted-foreground">
              ({activeProtocol.toUpperCase()})
            </span>
          )}
        </div>
      );
    } else if (streamStatus === "idle") {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          <span>Waiting for connection...</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span>Stream disabled</span>
        </div>
      );
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connection Status</span>
            {getStatusIndicator()}
          </CardTitle>
          <CardDescription>
            Connect your broadcasting software using RTMP or SRT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingStream && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Creating your stream...
            </div>
          )}

          {streamError && (
            <div className="text-sm text-destructive">
              <p>{streamError}</p>
              <Button
                onClick={onRetryStream}
                variant="link"
                className="h-auto p-0 text-xs"
              >
                Try again
              </Button>
            </div>
          )}

          {streamKey && (
            <>
              <div className="space-y-2">
                <Label>Stream Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={streamKey}
                    readOnly
                    className="font-mono text-sm"
                    type="password"
                  />
                  <CopyButton text={streamKey} field="streamKey" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep this private - anyone with this key can stream to your account
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                      1
                    </span>
                    RTMP Configuration
                  </h4>
                  <div className="space-y-2 ml-8">
                    <div>
                      <Label className="text-xs text-muted-foreground">Server URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={rtmpUrl}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <CopyButton text={rtmpUrl} field="rtmpUrl" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stream Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={streamKey}
                          readOnly
                          className="font-mono text-xs"
                          type="password"
                        />
                        <CopyButton text={streamKey} field="rtmpKey" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Full URL (alternative)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={fullRtmpUrl}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <CopyButton text={fullRtmpUrl} field="fullRtmp" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                      2
                    </span>
                    SRT Configuration
                  </h4>
                  <div className="space-y-2 ml-8">
                    <div>
                      <Label className="text-xs text-muted-foreground">SRT URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={srtUrl}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <CopyButton text={srtUrl} field="srtUrl" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SRT provides lower latency and better error recovery than RTMP
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Quick setup guides for popular streaming software
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!streamKey && (
            <div className="text-sm text-muted-foreground">
              Waiting for stream to be created...
            </div>
          )}

          {streamKey && (
            <>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <IconVideo className="size-4" />
                OBS Studio
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
                <li>Open Settings → Stream</li>
                <li>Service: Custom</li>
                <li>Server: <code className="text-xs bg-muted px-1 py-0.5 rounded">{rtmpUrl}</code></li>
                <li>Stream Key: (paste your stream key)</li>
                <li>Click "Start Streaming"</li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                FFmpeg
              </h4>
              <p className="text-sm text-muted-foreground">
                Stream a video file:
              </p>
              <div className="relative">
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                  <code>{`ffmpeg -re -i input.mp4 \\
  -c:v libx264 -preset veryfast \\
  -c:a aac -b:a 128k \\
  -f flv ${rtmpUrl}/${streamKey}`}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(
                    `ffmpeg -re -i input.mp4 -c:v libx264 -preset veryfast -c:a aac -b:a 128k -f flv ${rtmpUrl}/${streamKey}`,
                    "ffmpeg"
                  )}
                >
                  {copiedField === "ffmpeg" ? (
                    <IconCheck className="size-4" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                Other Software
              </h4>
              <p className="text-sm text-muted-foreground">
                Compatible with: vMix, Wirecast, StreamLabs, XSplit, and any software supporting RTMP/SRT output.
              </p>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

