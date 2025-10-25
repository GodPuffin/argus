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
  IconRewindBackward10,
  IconRewindForward10,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconMinimize,
  IconRadar,
  IconRadarOff,
  IconSettings
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
import { useDetections } from "@/hooks/use-detections";
import { DetectionOverlay } from "@/components/watch/detection-overlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

export default function WatchAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerRef = useRef<any>(null);
  
  const { id } = use(params);
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [detectionsEnabled, setDetectionsEnabled] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [confidenceThreshold, setConfidenceThreshold] = useState(0.3);
  const [persistenceTime, setPersistenceTime] = useState(1.0);
  const [interpolationEnabled, setInterpolationEnabled] = useState(true);
  const [fadeEnabled, setFadeEnabled] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const timestamp = searchParams.get("timestamp");
  const startTime = timestamp ? parseFloat(timestamp) : undefined;

  // Fetch events for this asset
  const { events, loading: eventsLoading } = useEventsRealtime(id);

  // Fetch detections for this asset
  const { detections, loading: detectionsLoading } = useDetections(
    asset?.id || null,
    { enabled: true }
  );
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

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(player.volume);
      setIsMuted(player.muted);
    };
    const handleDurationChange = () => setDuration(player.duration || 0);
    const handleLoadedMetadata = () => setDuration(player.duration || 0);

    player.addEventListener("play", handlePlay);
    player.addEventListener("pause", handlePause);
    player.addEventListener("volumechange", handleVolumeChange);
    player.addEventListener("durationchange", handleDurationChange);
    player.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      player.removeEventListener("play", handlePlay);
      player.removeEventListener("pause", handlePause);
      player.removeEventListener("volumechange", handleVolumeChange);
      player.removeEventListener("durationchange", handleDurationChange);
      player.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [asset]);

  // Use requestAnimationFrame for smooth 60fps currentTime updates
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    let animationFrameId: number;
    let mounted = true;
    
    const updateTime = () => {
      // Check mounted flag to prevent updates after cleanup
      if (!mounted) return;
      
      if (player && player.currentTime !== undefined) {
        setCurrentTime(player.currentTime);
      }
      // Continue the loop only if still mounted
      if (mounted) {
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    animationFrameId = requestAnimationFrame(updateTime);

    return () => {
      mounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [asset]); // Re-run when asset changes to get new player reference

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

  useEffect(() => {
    const updateDimensions = () => {
      const player = playerRef.current;
      if (!player) return;

      const videoElement = player.media || player.querySelector('video');
      if (!videoElement) return;

      const videoWidth = videoElement.videoWidth || 1920;
      const videoHeight = videoElement.videoHeight || 1080;

      setVideoDimensions({
        width: videoWidth,
        height: videoHeight,
      });
    };

    const player = playerRef.current;
    if (player) {
      player.addEventListener("loadedmetadata", updateDimensions);
      player.addEventListener("resize", updateDimensions);
      updateDimensions();
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      if (player) {
        player.removeEventListener("loadedmetadata", updateDimensions);
        player.removeEventListener("resize", updateDimensions);
      }
      window.removeEventListener("resize", updateDimensions);
    };
  }, [asset]);

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
    
    // Scroll to top to view the video
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
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
                  ref={containerRef}
                  className="relative w-full h-full cursor-pointer"
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

                  {/* Detection Overlay */}
                  {detectionsEnabled && detections.length > 0 && (
                    <DetectionOverlay
                      detections={detections}
                      currentTime={currentTime}
                      videoDimensions={videoDimensions}
                      enabled={detectionsEnabled}
                      confidenceThreshold={confidenceThreshold}
                      persistenceTime={persistenceTime}
                      interpolationEnabled={interpolationEnabled}
                      fadeEnabled={fadeEnabled}
                    />
                  )}
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
                      <IconRewindBackward10 className="size-5" />
                    </Button>

                    {/* Skip Forward */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipForward}
                      className="h-9 w-9"
                      title="Skip forward 10s (→)"
                    >
                      <IconRewindForward10 className="size-5" />
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
                    {/* Detection Toggle - Always show for ready videos */}
                    {asset?.status === "ready" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetectionsEnabled(!detectionsEnabled)}
                        className="h-9 w-9"
                        title="Toggle person detection overlay"
                      >
                        {detectionsEnabled ? (
                          <IconRadarOff className="size-5" />
                        ) : (
                          <IconRadar className="size-5" />
                        )}
                      </Button>
                    )}

                    {/* Detection Settings */}
                    {asset?.status === "ready" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            title={
                              !detectionsEnabled
                                ? "Enable detections to access settings"
                                : detections.length === 0
                                ? "No detections available yet"
                                : "Detection settings"
                            }
                            disabled={!detectionsEnabled || detections.length === 0}
                          >
                            <IconSettings className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                          <DropdownMenuLabel>Detection Settings</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <div className="px-2 py-3 space-y-4">
                            {/* Confidence Threshold */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Confidence Threshold</Label>
                                <span className="text-xs text-muted-foreground">{Math.round(confidenceThreshold * 100)}%</span>
                              </div>
                              <Slider
                                value={[confidenceThreshold]}
                                min={0.1}
                                max={0.9}
                                step={0.05}
                                onValueChange={(values) => setConfidenceThreshold(values[0])}
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground">
                                Minimum confidence to show detections
                              </p>
                            </div>

                            {/* Persistence Time */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Persistence Time</Label>
                                <span className="text-xs text-muted-foreground">{persistenceTime.toFixed(1)}s</span>
                              </div>
                              <Slider
                                value={[persistenceTime]}
                                min={0.5}
                                max={5.0}
                                step={0.5}
                                onValueChange={(values) => setPersistenceTime(values[0])}
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground">
                                How long to show detections after they disappear
                              </p>
                            </div>

                            {/* Smooth Interpolation Toggle */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-sm">Smooth Interpolation</Label>
                                <p className="text-xs text-muted-foreground">
                                  Smoothly animate boxes between frames
                                </p>
                              </div>
                              <Button
                                variant={interpolationEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => setInterpolationEnabled(!interpolationEnabled)}
                                className="ml-2"
                              >
                                {interpolationEnabled ? "On" : "Off"}
                              </Button>
                            </div>

                            {/* Fade Effect Toggle */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-sm">Fade Effect</Label>
                                <p className="text-xs text-muted-foreground">
                                  Fade older detections for visual clarity
                                </p>
                              </div>
                              <Button
                                variant={fadeEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFadeEnabled(!fadeEnabled)}
                                className="ml-2"
                              >
                                {fadeEnabled ? "On" : "Off"}
                              </Button>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

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
