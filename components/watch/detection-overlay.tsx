import { useMemo } from "react";
import type { DetectionFrame, Detection } from "@/lib/detection-queries";

interface DetectionOverlayProps {
  detections: DetectionFrame[];
  currentTime: number;
  videoDimensions: { width: number; height: number };
  enabled: boolean;
  confidenceThreshold?: number;
  persistenceTime?: number;
  interpolationEnabled?: boolean;
  fadeEnabled?: boolean;
}

interface PersistedDetection extends Detection {
  age: number;
  persisted: boolean;
  velocity?: { x: number; y: number; width: number; height: number };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number, easing: boolean = true): number {
  const easedT = easing ? easeInOutQuad(t) : t;
  return a + (b - a) * easedT;
}

function interpolateBbox(
  bbox1: Detection["bbox"],
  bbox2: Detection["bbox"],
  t: number,
  useEasing: boolean = true,
): Detection["bbox"] {
  return {
    x: lerp(bbox1.x, bbox2.x, t, useEasing),
    y: lerp(bbox1.y, bbox2.y, t, useEasing),
    width: lerp(bbox1.width, bbox2.width, t, useEasing),
    height: lerp(bbox1.height, bbox2.height, t, useEasing),
  };
}

function getCurrentDetections(
  detections: DetectionFrame[],
  currentTime: number,
  options: {
    confidenceThreshold: number;
    persistenceTime: number;
    interpolationEnabled: boolean;
  },
): PersistedDetection[] {
  const { confidenceThreshold, persistenceTime, interpolationEnabled } = options;

  const beforeFrames = detections.filter((f) => f.frame_timestamp <= currentTime);
  const afterFrames = detections.filter((f) => f.frame_timestamp > currentTime);

  if (beforeFrames.length === 0 && afterFrames.length === 0) return [];

  const prevFrame = beforeFrames[beforeFrames.length - 1];
  const nextFrame = afterFrames[0];

  const age = prevFrame ? currentTime - prevFrame.frame_timestamp : Infinity;

  if (age > persistenceTime && !nextFrame) return [];

  const baseDetections = prevFrame?.detections.filter(
    (det) => det.confidence >= confidenceThreshold
  ) || [];

  if (!interpolationEnabled || !nextFrame) {
    return baseDetections.map((det) => ({
      ...det,
      age,
      persisted: age > 0.2,
    }));
  }

  const timeBetweenFrames = nextFrame.frame_timestamp - prevFrame.frame_timestamp;
  const rawT = (currentTime - prevFrame.frame_timestamp) / timeBetweenFrames;
  const t = Math.max(0, Math.min(1, rawT));

  const interpolatedDetections: PersistedDetection[] = [];

  for (const prevDet of baseDetections) {
    const nextDet = nextFrame.detections
      .filter((d) => d.confidence >= confidenceThreshold)
      .reduce<Detection | null>((closest, det) => {
        const prevCenter = { x: prevDet.bbox.x + prevDet.bbox.width / 2, y: prevDet.bbox.y + prevDet.bbox.height / 2 };
        const detCenter = { x: det.bbox.x + det.bbox.width / 2, y: det.bbox.y + det.bbox.height / 2 };
        const distance = Math.hypot(detCenter.x - prevCenter.x, detCenter.y - prevCenter.y);

        if (!closest) return det;

        const closestCenter = { x: closest.bbox.x + closest.bbox.width / 2, y: closest.bbox.y + closest.bbox.height / 2 };
        const closestDistance = Math.hypot(closestCenter.x - prevCenter.x, closestCenter.y - prevCenter.y);

        return distance < closestDistance ? det : closest;
      }, null);

    if (nextDet) {
      const velocity = {
        x: (nextDet.bbox.x - prevDet.bbox.x) / timeBetweenFrames,
        y: (nextDet.bbox.y - prevDet.bbox.y) / timeBetweenFrames,
        width: (nextDet.bbox.width - prevDet.bbox.width) / timeBetweenFrames,
        height: (nextDet.bbox.height - prevDet.bbox.height) / timeBetweenFrames,
      };

      const interpolatedBbox = interpolateBbox(prevDet.bbox, nextDet.bbox, t, true);
      
      const predictionFactor = 0.15;
      const timeAhead = predictionFactor * timeBetweenFrames;
      
      const smoothedBbox = {
        x: interpolatedBbox.x + velocity.x * timeAhead * t,
        y: interpolatedBbox.y + velocity.y * timeAhead * t,
        width: Math.max(0.01, interpolatedBbox.width + velocity.width * timeAhead * t),
        height: Math.max(0.01, interpolatedBbox.height + velocity.height * timeAhead * t),
      };

      interpolatedDetections.push({
        class: prevDet.class,
        confidence: lerp(prevDet.confidence, nextDet.confidence, t, true),
        bbox: smoothedBbox,
        age,
        persisted: false,
        velocity,
      });
    } else {
      interpolatedDetections.push({
        ...prevDet,
        age,
        persisted: true,
      });
    }
  }

  return interpolatedDetections;
}


export function DetectionOverlay({
  detections,
  currentTime,
  videoDimensions,
  enabled,
  confidenceThreshold = 0.3,
  persistenceTime = 2.0,
  interpolationEnabled = true,
  fadeEnabled = true,
}: DetectionOverlayProps) {
  const currentDetections = useMemo(() => {
    if (!enabled || detections.length === 0) return [];
    return getCurrentDetections(detections, currentTime, {
      confidenceThreshold,
      persistenceTime,
      interpolationEnabled,
    });
  }, [detections, currentTime, enabled, confidenceThreshold, persistenceTime, interpolationEnabled]);

  if (!enabled || currentDetections.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${videoDimensions.width} ${videoDimensions.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <style>
        {interpolationEnabled ? `
          .detection-box {
            transition: x 0.15s cubic-bezier(0.4, 0, 0.2, 1), 
                        y 0.15s cubic-bezier(0.4, 0, 0.2, 1), 
                        width 0.15s cubic-bezier(0.4, 0, 0.2, 1), 
                        height 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .detection-label {
            transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          }
        ` : ''}
      </style>
      {currentDetections.map((detection, idx) => {
        const x = detection.bbox.x * videoDimensions.width;
        const y = detection.bbox.y * videoDimensions.height;
        const width = detection.bbox.width * videoDimensions.width;
        const height = detection.bbox.height * videoDimensions.height;

        const baseColor = detection.confidence >= 0.7 ? "#22c55e" : "#eab308";

        const opacity = fadeEnabled
          ? Math.max(0.3, 1 - (detection.age / persistenceTime) * 0.7)
          : 1;

        const strokeWidth = detection.persisted ? 1.5 : 2;
        const labelWidth = (detection.confidence * 100).toFixed(0).length * 8 + 16;

        return (
          <g key={`detection-${idx}`} opacity={opacity}>
            <rect
              className="detection-box"
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={baseColor}
              strokeWidth={strokeWidth}
              strokeDasharray={detection.persisted ? "4 2" : "none"}
              rx="4"
            />

            <g className="detection-label" transform={`translate(${x}, ${y - 8})`}>
              <rect
                x="0"
                y="0"
                width={labelWidth}
                height="20"
                fill={baseColor}
                rx="4"
              />
              <text
                x="8"
                y="14"
                fill="#000"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui"
              >
                {(detection.confidence * 100).toFixed(0)}%
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

