import { useState, useEffect } from "react";

export function useStreamState() {
  const [connected, setConnected] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState("");
  const [streamId, setStreamId] = useState("");
  const [playbackId, setPlaybackId] = useState("");
  const [loadingStream, setLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [browserId, setBrowserId] = useState<string>("");
  const [cameraName, setCameraName] = useState<string>("");
  const [cameraId, setCameraId] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [dataRate, setDataRate] = useState(0);
  const [dataHistory, setDataHistory] = useState<Array<{ time: string; rate: number }>>([]);

  // Load text overlay from local storage
  const [textOverlay, setTextOverlay] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stream_text_overlay') || "Live from Argus!";
    }
    return "Live from Argus!";
  });

  // Save text overlay to local storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stream_text_overlay', textOverlay);
    }
  }, [textOverlay]);

  return {
    connected, setConnected,
    cameraEnabled, setCameraEnabled,
    streaming, setStreaming,
    streamKey, setStreamKey,
    streamId, setStreamId,
    playbackId, setPlaybackId,
    textOverlay, setTextOverlay,
    loadingStream, setLoadingStream,
    streamError, setStreamError,
    browserId, setBrowserId,
    cameraName, setCameraName,
    cameraId, setCameraId,
    editingName, setEditingName,
    editNameValue, setEditNameValue,
    dataRate, setDataRate,
    dataHistory, setDataHistory,
  };
}

