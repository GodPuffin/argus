"use client";

import React, { useEffect, useState, useRef } from "react";
import { SiteHeader } from "@/components/site-header";
import { StreamControls } from "@/components/stream/stream-controls";
import { NetworkStats } from "@/components/stream/network-stats";
import { VideoDisplay } from "@/components/stream/video-display";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStreamState } from "@/hooks/use-stream-state";
import { useStreamManager } from "@/hooks/use-stream-manager";
import { useCameraRealtime } from "@/hooks/use-camera-realtime";

export default function StreamPage() {
  const state = useStreamState();
  const inputStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const requestAnimationRef = useRef<number>(0);
  const nameRef = useRef(state.textOverlay);
  const bytesSentRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const [showHmrWarning, setShowHmrWarning] = useState(false);

  const streamManager = useStreamManager({
    browserId: state.browserId,
    setBrowserId: state.setBrowserId,
    setStreamKey: state.setStreamKey,
    setStreamId: state.setStreamId,
    setPlaybackId: state.setPlaybackId,
    setCameraName: state.setCameraName,
    setCameraId: state.setCameraId,
    setEditNameValue: state.setEditNameValue,
    setLoadingStream: state.setLoadingStream,
    setStreamError: state.setStreamError,
  });

  // Subscribe to realtime updates for this camera
  const realtimeCamera = useCameraRealtime(state.browserId);

  // Sync realtime camera data with local state
  useEffect(() => {
    if (realtimeCamera) {
      // Update local state when realtime data changes
      if (realtimeCamera.camera_name !== state.cameraName) {
        state.setCameraName(realtimeCamera.camera_name);
        state.setEditNameValue(realtimeCamera.camera_name);
      }
    }
  }, [realtimeCamera, state]);

  const saveCameraName = async () => {
    if (!state.cameraId || !state.editNameValue.trim()) return;

    try {
      const response = await fetch(`/api/cameras/${state.cameraId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cameraName: state.editNameValue.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update camera name");
      }

      state.setCameraName(state.editNameValue.trim());
      state.setEditingName(false);
    } catch (error) {
      console.error("Error updating camera name:", error);
      alert("Failed to update camera name");
    }
  };

  const cancelEditName = () => {
    state.setEditNameValue(state.cameraName);
    state.setEditingName(false);
  };

  const enableCamera = async () => {
    try {
      inputStreamRef.current =
        await navigator.mediaDevices.getUserMedia(streamManager.CAMERA_CONSTRAINTS);

      if (videoRef.current) {
        videoRef.current.srcObject = inputStreamRef.current;
        await videoRef.current.play();

        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }

        requestAnimationRef.current = requestAnimationFrame(updateCanvas);
        state.setCameraEnabled(true);
      }
    } catch (error) {
      console.error("Error enabling camera:", error);
      alert("Failed to access camera. Please grant permissions and try again.");
    }
  };

  const updateCanvas = () => {
    if (
      !videoRef.current ||
      videoRef.current.ended ||
      videoRef.current.paused
    ) {
      return;
    }

    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );

    // Add text overlay
    ctx.fillStyle = "#FF1791";
    ctx.font = "32px system-ui, -apple-system, sans-serif";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;

    const date = new Date();
    const dateText = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    const displayText = `${nameRef.current} ${dateText}`;

    ctx.strokeText(displayText, 10, 40);
    ctx.fillText(displayText, 10, 40);

    requestAnimationRef.current = requestAnimationFrame(updateCanvas);
  };

  const stopStreaming = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      // Don't immediately close WebSocket - let MediaRecorder's stop event handle it
      // This ensures all buffered data is flushed first
    } else {
      // If MediaRecorder isn't recording, clean up WebSocket directly
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    }
    state.setStreaming(false);
    state.setDataRate(0);
    state.setDataHistory([]);
    bytesSentRef.current = 0;
  };

  const startStreaming = () => {
    if (!state.streamKey) {
      alert("Stream not ready. Please wait for stream creation to complete.");
      return;
    }

    if (!canvasRef.current || !inputStreamRef.current) {
      alert("Camera not ready. Please enable camera first.");
      return;
    }

    state.setStreaming(true);
    const settings = streamManager.getRecorderSettings();
    const protocol = window.location.protocol.replace("http", "ws");
    const wsUrl = new URL(`${protocol}//${window.location.host}/rtmp`);
    wsUrl.searchParams.set("format", settings.format);
    wsUrl.searchParams.set("video", settings.video);
    wsUrl.searchParams.set("audio", settings.audio);
    wsUrl.searchParams.set("key", state.streamKey);

    console.log("Connecting to streaming server with settings:", settings);
    wsRef.current = new WebSocket(wsUrl.toString());

    wsRef.current.addEventListener("open", () => {
      console.log("✓ WebSocket connected - Starting MediaRecorder...");
      state.setConnected(true);

      const videoOutputStream = canvasRef.current!.captureStream(30);
      const audioStream = new MediaStream();
      const audioTracks = inputStreamRef.current!.getAudioTracks();
      audioTracks.forEach((track) => {
        audioStream.addTrack(track);
      });

      const outputStream = new MediaStream();
      [audioStream, videoOutputStream].forEach((s) => {
        s.getTracks().forEach((t) => {
          outputStream.addTrack(t);
        });
      });

      mediaRecorderRef.current = new MediaRecorder(outputStream, {
        mimeType: streamManager.getRecorderMimeType(),
        videoBitsPerSecond: 3000000,
        audioBitsPerSecond: 64000,
      });

      mediaRecorderRef.current.addEventListener("dataavailable", (e) => {
        if (e.data && e.data.size > 0) {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data);
            
            bytesSentRef.current += e.data.size;
            const now = Date.now();
            const timeDiff = (now - lastUpdateTimeRef.current) / 1000;
            
            if (timeDiff >= 1) {
              const rate = (bytesSentRef.current / timeDiff) / 1024;
              const roundedRate = Math.round(rate);
              state.setDataRate(roundedRate);
              
              const currentTime = new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                minute: '2-digit', 
                second: '2-digit' 
              });
              state.setDataHistory(prev => {
                const newData = [...prev, { time: currentTime, rate: roundedRate }];
                return newData.slice(-30);
              });
              
              bytesSentRef.current = 0;
              lastUpdateTimeRef.current = now;
            }
          } else {
            console.warn("WebSocket not ready, dropping chunk");
          }
        }
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        console.log("MediaRecorder stopped - waiting for final data chunks...");
        // Give MediaRecorder time to flush any remaining data chunks
        // The 'dataavailable' event may fire after 'stop' with final buffered data
        setTimeout(() => {
          console.log("Closing WebSocket connection...");
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
          }
        }, 500); // Wait 500ms for final chunks to be sent
      });

      mediaRecorderRef.current.addEventListener("error", (e) => {
        console.error("MediaRecorder error:", e);
      });

      console.log("✓ Starting MediaRecorder in 100ms...");
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "inactive"
        ) {
          mediaRecorderRef.current.start(100);
          console.log("✓ MediaRecorder started!");
        }
      }, 100);
    });

    wsRef.current.addEventListener("close", (event) => {
      console.log("WebSocket disconnected", { code: event.code, reason: event.reason });
      state.setConnected(false);
      
      // Check if this was an unexpected disconnect (not user-initiated)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.warn("⚠️ Stream interrupted unexpectedly! This may be due to code changes in development mode.");
        // Show warning banner in development
        if (process.env.NODE_ENV === "development") {
          setShowHmrWarning(true);
          setTimeout(() => setShowHmrWarning(false), 5000);
        }
      }
      
      stopStreaming();
    });

    wsRef.current.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      alert("Failed to connect to streaming server");
      stopStreaming();
    });
  };

  useEffect(() => {
    nameRef.current = state.textOverlay;
  }, [state.textOverlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("StreamPage unmounting - cleaning up resources");
      
      // Close WebSocket connection
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      
      // Cancel animation frame
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      
      // Stop camera tracks
      if (inputStreamRef.current) {
        inputStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="Stream" />
      {showHmrWarning && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
          ⚠️ Stream interrupted by code changes (Hot Module Reload). This only happens in development mode.
        </div>
      )}
      <ScrollArea className="flex min-h-0 flex-1">
        <div className="@container/main flex min-h-0 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StreamControls
              cameraName={state.cameraName}
              editingName={state.editingName}
              editNameValue={state.editNameValue}
              streaming={state.streaming}
              connected={state.connected}
              loadingStream={state.loadingStream}
              streamError={state.streamError}
              textOverlay={state.textOverlay}
              cameraEnabled={state.cameraEnabled}
              streamKey={state.streamKey}
              onEditNameChange={state.setEditNameValue}
              onSaveName={saveCameraName}
              onCancelEdit={cancelEditName}
              onStartEdit={() => state.setEditingName(true)}
              onTextOverlayChange={state.setTextOverlay}
              onEnableCamera={enableCamera}
              onStartStreaming={startStreaming}
              onStopStreaming={stopStreaming}
              onRetryStream={streamManager.createMuxStream}
            />
            <NetworkStats
              dataRate={state.dataRate}
              dataHistory={state.dataHistory}
              streaming={state.streaming}
            />
          </div>

          <VideoDisplay
            videoRef={videoRef}
            canvasRef={canvasRef}
            cameraEnabled={state.cameraEnabled}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
