"use client";

import { IconVideo } from "@tabler/icons-react";

interface VideoDisplayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraEnabled: boolean;
}

export function VideoDisplay({ videoRef, canvasRef, cameraEnabled }: VideoDisplayProps) {
  return (
    <div className="relative w-full max-w-5xl mx-auto min-h-[400px] rounded-lg overflow-hidden flex items-center justify-center">
      {!cameraEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center text-muted-foreground">
            <IconVideo className="size-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Click "Enable Camera" to start</p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 opacity-0 pointer-events-none">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain rounded-lg ${!cameraEnabled ? "hidden" : ""}`}
      />
    </div>
  );
}

