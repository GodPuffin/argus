import { useEffect, useRef } from "react";

const CAMERA_CONSTRAINTS = {
  audio: true,
  video: true,
};

const getRecorderSettings = () => {
  const settings: { format: string; video: string; audio: string } = {
    format: "",
    video: "",
    audio: "",
  };
  
  // Prefer WebM for streaming - it handles continuous streams better than MP4
  // MP4 chunks have complete container metadata that can confuse streaming parsers
  if (MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")) {
    settings.format = "webm";
    settings.video = "h264";
    settings.audio = "opus";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
    settings.format = "webm";
    settings.video = "vp8";
    settings.audio = "opus";
  } else if (MediaRecorder.isTypeSupported("video/mp4")) {
    // Fallback to MP4 if WebM not supported
    settings.format = "mp4";
    settings.video = "h264";
    settings.audio = "aac";
  } else {
    // Last resort
    settings.format = "webm";
    settings.audio = "opus";
    settings.video = "vp8";
  }
  return settings;
};

const getRecorderMimeType = () => {
  const settings = getRecorderSettings();
  const codecs =
    settings.format === "webm"
      ? `;codecs="${settings.video}, ${settings.audio}"`
      : "";
  return `video/${settings.format}${codecs}`;
};

interface UseStreamManagerProps {
  browserId: string;
  setBrowserId: (id: string) => void;
  setStreamKey: (key: string) => void;
  setStreamId: (id: string) => void;
  setPlaybackId: (id: string) => void;
  setCameraName: (name: string) => void;
  setCameraId: (id: string) => void;
  setEditNameValue: (value: string) => void;
  setLoadingStream: (loading: boolean) => void;
  setStreamError: (error: string) => void;
}

export function useStreamManager(props: UseStreamManagerProps) {
  const {
    browserId,
    setBrowserId,
    setStreamKey,
    setStreamId,
    setPlaybackId,
    setCameraName,
    setCameraId,
    setEditNameValue,
    setLoadingStream,
    setStreamError,
  } = props;

  const getBrowserId = () => {
    let id = localStorage.getItem("camera_browser_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("camera_browser_id", id);
    }
    return id;
  };

  const createMuxStream = async (signal?: AbortSignal) => {
    setLoadingStream(true);
    setStreamError("");

    try {
      const response = await fetch("/api/stream/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ browserId }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create stream");
      }

      const data = await response.json();
      setStreamKey(data.streamKey);
      setStreamId(data.streamId);
      setPlaybackId(data.playbackId || "");
      setCameraName(data.cameraName || "");
      setCameraId(data.cameraId || "");
      setEditNameValue(data.cameraName || "");

      if (data.isExisting) {
        console.log("Reusing existing stream:", data);
      } else {
        console.log("Stream created:", data);
      }
    } catch (error) {
      // Ignore AbortError - this is expected when the request is cancelled
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error creating stream:", error);
      setStreamError(
        error instanceof Error ? error.message : "Failed to create stream",
      );
    } finally {
      setLoadingStream(false);
    }
  };

  // Initialize browser ID on mount
  useEffect(() => {
    const id = getBrowserId();
    setBrowserId(id);
  }, [setBrowserId]);

  // Create/fetch stream once we have browser ID
  useEffect(() => {
    if (!browserId) {
      return;
    }

    // Create AbortController to cancel request on unmount or browserId change
    const controller = new AbortController();
    createMuxStream(controller.signal);

    // Cleanup: abort the request if component unmounts or browserId changes
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browserId]);

  return {
    createMuxStream,
    CAMERA_CONSTRAINTS,
    getRecorderSettings,
    getRecorderMimeType,
  };
}
