"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import "@mux/mux-player/themes/minimal";
import { 
  IconArrowLeft, 
  IconAlertCircle, 
  IconPlayerPlay, 
  IconPlayerPause,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconMinimize
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { supabase, type Asset, getAssetPlaybackId } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { EventTimeline } from "@/components/watch/event-timeline";
import { useEventsRealtime } from "@/hooks/use-events-realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function WatchAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerRef = useRef<any>(null);
  
  // Unwrap params promise (Next.js 15+ requirement)
  const { id } = use(params);
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timestamp = searchParams.get("timestamp");
  const startTime = timestamp ? parseFloat(timestamp) : undefined;

  // Fetch events for this asset
  const { events, loading: eventsLoading } = useEventsRealtime(id);

  // Fetch asset data
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .schema("mux")
          .from("assets")
          .select("*")
          .eq("id", id)
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
  }, [id]);

  // Setup player event listeners
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(player.volume);
      setIsMuted(player.muted);
    };
    const handleTimeUpdate = () => setCurrentTime(player.currentTime || 0);
    const handleDurationChange = () => setDuration(player.duration || 0);
    const handleLoadedMetadata = () => setDuration(player.duration || 0);

    player.addEventListener("play", handlePlay);
    player.addEventListener("pause", handlePause);
    player.addEventListener("volumechange", handleVolumeChange);
    player.addEventListener("timeupdate", handleTimeUpdate);
    player.addEventListener("durationchange", handleDurationChange);
    player.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      player.removeEventListener("play", handlePlay);
      player.removeEventListener("pause", handlePause);
      player.removeEventListener("volumechange", handleVolumeChange);
      player.removeEventListener("timeupdate", handleTimeUpdate);
      player.removeEventListener("durationchange", handleDurationChange);
      player.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [asset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen();
        } else {
          router.back();
        }
      } else if (e.key === " " && playerRef.current) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "ArrowLeft" && playerRef.current) {
        e.preventDefault();
        skipBackward();
      } else if (e.key === "ArrowRight" && playerRef.current) {
        e.preventDefault();
        skipForward();
      } else if (e.key === "m" && playerRef.current) {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f" && playerRef.current) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, isFullscreen]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleBack = () => {
    router.back();
  };

  // Video control functions
  const togglePlayPause = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  };

  const skipBackward = () => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = Math.max(0, player.currentTime - 10);
  };

  const skipForward = () => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    player.muted = !player.muted;
  };

  const handleVolumeChange = (values: number[]) => {
    const player = playerRef.current;
    if (!player) return;
    player.volume = values[0];
    if (values[0] > 0 && player.muted) {
      player.muted = false;
    }
  };

  const seekToTime = (seconds: number, autoPlay = false) => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = seconds;
    if (autoPlay && player.paused) {
      player.play();
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById("video-container");
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: string | number) => {
    const date = typeof timestamp === 'string' && timestamp.includes('-') 
      ? new Date(timestamp) 
      : new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex items-center justify-center" style={{ height: "70vh" }}>
          <div className="text-center space-y-4">
            <Spinner variant="ring" size={48} className="mx-auto" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Top bar with back button */}
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <IconArrowLeft className="size-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-center flex-1" style={{ height: "60vh" }}>
          <div className="text-center space-y-4 p-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <IconAlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">{error || "Video not found"}</h1>
            <p className="text-muted-foreground">
              {error === "Video not found" 
                ? "The video you're looking for doesn't exist or has been deleted."
                : "There was a problem loading this video. Please try again later."}
            </p>
            <Button onClick={handleBack} variant="secondary">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const playbackId = getAssetPlaybackId(asset);
  const hasError = asset.status === "errored" || !playbackId;
  const isProcessing = asset.status !== "ready" && asset.status !== "errored";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header with back button and video info */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center justify-between h-14 px-4 max-w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <IconArrowLeft className="size-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {asset.meta?.title && (
              <h1 className="font-semibold text-foreground">{asset.meta.title}</h1>
            )}
            <span>{formatDuration(asset.duration_seconds || 0)}</span>
            {asset.max_resolution_tier && (
              <span>{asset.max_resolution_tier}</span>
            )}
            <span>{formatDate(asset.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {/* Video player container */}
          <div 
            id="video-container"
            className="relative bg-black"
            style={{ height: "70vh" }}
          >
            <div className="w-full h-full flex items-center justify-center">
              {hasError ? (
                <div className="text-center space-y-4 p-8">
                  <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                    <IconAlertCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Video Unavailable</h2>
                  <p className="text-white/70">
                    {asset.status === "errored" 
                      ? "This video failed to process and cannot be played."
                      : "This video cannot be played at this time."}
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="text-center space-y-4 p-8">
                  <Spinner variant="ring" size={48} className="mx-auto text-yellow-500" />
                  <h2 className="text-xl font-semibold text-white">Processing Video</h2>
                  <p className="text-white/70">
                    This video is still being processed. Please check back in a few moments.
                  </p>
                  {asset.is_live && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                      Currently Recording
                    </Badge>
                  )}
                </div>
              ) : (
                <div 
                  className="w-full h-full cursor-pointer"
                  onClick={togglePlayPause}
                >
                  <MuxPlayer
                    ref={playerRef}
                    theme="minimal"
                    playbackId={playbackId!}
                    streamType="on-demand"
                    startTime={startTime}
                    disableTracking={true}
                    disableCookies={true}
                    style={{
                      width: "100%",
                      height: "100%",
                      "--controls": "none",
                      pointerEvents: "none",
                    } as React.CSSProperties}
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Custom Video Controls */}
          {!hasError && !isProcessing && (
            <div className="border-b bg-background/95 backdrop-blur">
              <div className="px-4 py-3 max-w-full">
                {/* Interactive Timeline with Events */}
                <div className="mb-3">
                  <EventTimeline
                    events={events}
                    duration={duration}
                    currentTime={currentTime}
                    onSeek={seekToTime}
                  />
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayPause}
                      className="h-9 w-9"
                    >
                      {isPlaying ? (
                        <IconPlayerPause className="size-5" />
                      ) : (
                        <IconPlayerPlay className="size-5" />
                      )}
                    </Button>

                    {/* Skip Backward */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipBackward}
                      className="h-9 w-9"
                      title="Skip backward 10s (←)"
                    >
                      <IconPlayerSkipBack className="size-5" />
                    </Button>

                    {/* Skip Forward */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipForward}
                      className="h-9 w-9"
                      title="Skip forward 10s (→)"
                    >
                      <IconPlayerSkipForward className="size-5" />
                    </Button>

                    {/* Volume */}
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="h-9 w-9"
                        title="Mute (m)"
                      >
                        {isMuted || volume === 0 ? (
                          <IconVolumeOff className="size-5" />
                        ) : (
                          <IconVolume className="size-5" />
                        )}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-24 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center gap-2">
                    {/* Fullscreen */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="h-9 w-9"
                      title="Fullscreen (f)"
                    >
                      {isFullscreen ? (
                        <IconMinimize className="size-5" />
                      ) : (
                        <IconMaximize className="size-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Events Section */}
          <div className="py-6 px-4 max-w-7xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Timeline Events</h2>
            
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner variant="ring" size={32} />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  No events detected in this video
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${getBorderColor(event.severity)}`}
                    onClick={() => seekToTime(event.timestamp_seconds, true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={event.severity === "High" ? "destructive" : "secondary"}
                              className={getSeverityBadgeClass(event.severity)}
                            >
                              {event.severity}
                            </Badge>
                            <Badge variant="outline">{event.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(event.timestamp_seconds)}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{event.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                          {event.affected_entities && Array.isArray(event.affected_entities) && event.affected_entities.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">Involved:</span>
                              <TooltipProvider>
                                {event.affected_entities.map((entity: any, idx: number) => {
                                  const entityName = entity.label || entity.name || entity.type || "Unknown";
                                  
                                  return (
                                    <Tooltip key={idx}>
                                      <TooltipTrigger asChild>
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs cursor-help hover:bg-accent"
                                        >
                                          {entityName}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <div className="space-y-1">
                                          <div className="font-semibold">{entityName}</div>
                                          {entity.confidence && (
                                            <div className="text-xs text-muted-foreground">
                                              Confidence: {(entity.confidence * 100).toFixed(1)}%
                                            </div>
                                          )}
                                          {entity.description && (
                                            <div className="text-xs">{entity.description}</div>
                                          )}
                                          {entity.bbox && (
                                            <div className="text-xs text-muted-foreground">
                                              Position: [{entity.bbox.map((n: number) => n.toFixed(2)).join(', ')}]
                                            </div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            seekToTime(event.timestamp_seconds, true);
                          }}
                        >
                          <IconPlayerPlay className="size-4 mr-1" />
                          Jump to Event
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function getBorderColor(severity: string): string {
  const colors: Record<string, string> = {
    High: "border-l-red-500",
    Medium: "border-l-yellow-500",
    Minor: "border-l-blue-500",
  };
  return colors[severity] || "border-l-blue-500";
}

function getSeverityBadgeClass(severity: string): string {
  const classes: Record<string, string> = {
    High: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    Medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
    Minor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  };
  return classes[severity] || classes.Minor;
}

