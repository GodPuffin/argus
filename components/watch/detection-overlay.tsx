/**
 * Detection Overlay Component
 * 
 * Renders bounding boxes over detected objects in video with smooth interpolation.
 * 
 * Key features:
 * - Smooth 60fps interpolation between sparse detection frames
 * - Binary search for efficient frame lookup
 * - Closest-match detection tracking across frames
 * - Configurable confidence threshold, persistence time, and fade effects
 * 
 * Performance notes:
 * - Designed to work with sparse detection data (e.g., 1 frame per second)
 * - Uses requestAnimationFrame for smooth updates (implemented in parent component)
 * - Binary search ensures O(log n) frame lookup even with many detection frames
 */

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

interface ProcessedDetection extends Detection {
  age: number;
  persisted: boolean;
}

// Simple linear interpolation
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// Smooth easing function for natural motion
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

// Find the closest matching detection in the next frame
function findMatchingDetection(
  sourceDetection: Detection,
  candidateDetections: Detection[],
  confidenceThreshold: number
): Detection | null {
  if (candidateDetections.length === 0) return null;

  const sourceCenterX = sourceDetection.bbox.x + sourceDetection.bbox.width / 2;
  const sourceCenterY = sourceDetection.bbox.y + sourceDetection.bbox.height / 2;

  let closestDetection: Detection | null = null;
  let minDistance = Infinity;

  for (const candidate of candidateDetections) {
    if (candidate.confidence < confidenceThreshold) continue;

    const candidateCenterX = candidate.bbox.x + candidate.bbox.width / 2;
    const candidateCenterY = candidate.bbox.y + candidate.bbox.height / 2;

    const distance = Math.sqrt(
      Math.pow(candidateCenterX - sourceCenterX, 2) +
      Math.pow(candidateCenterY - sourceCenterY, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestDetection = candidate;
    }
  }

  return closestDetection;
}

function getCurrentDetections(
  detections: DetectionFrame[],
  currentTime: number,
  options: {
    confidenceThreshold: number;
    persistenceTime: number;
    interpolationEnabled: boolean;
  }
): ProcessedDetection[] {
  const { confidenceThreshold, persistenceTime, interpolationEnabled } = options;

  if (detections.length === 0) return [];

  // Binary search for the frame just before or at currentTime
  let left = 0;
  let right = detections.length - 1;
  let prevFrameIdx = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const frame = detections[mid];

    if (frame.frame_timestamp <= currentTime) {
      prevFrameIdx = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  const prevFrame = prevFrameIdx >= 0 ? detections[prevFrameIdx] : null;
  const nextFrame = prevFrameIdx + 1 < detections.length ? detections[prevFrameIdx + 1] : null;

  // No frames available
  if (!prevFrame) {
    if (nextFrame) {
      // Only next frame available, use it if within persistence time
      const age = nextFrame.frame_timestamp - currentTime;
      if (age <= persistenceTime) {
        return nextFrame.detections
          .filter(det => det.confidence >= confidenceThreshold)
          .map(det => ({ ...det, age, persisted: false }));
      }
    }
    return [];
  }

  const age = currentTime - prevFrame.frame_timestamp;

  // Filter detections by confidence
  const prevDetections = prevFrame.detections.filter(
    det => det.confidence >= confidenceThreshold
  );

  // No interpolation or no next frame - return previous frame detections with persistence
  if (!interpolationEnabled || !nextFrame) {
    // Show detections as long as they're within persistence time
    if (age > persistenceTime) {
      return [];
    }
    return prevDetections.map(det => ({
      ...det,
      age,
      persisted: age > 0.1
    }));
  }

  // Interpolate between frames
  const timeDelta = nextFrame.frame_timestamp - prevFrame.frame_timestamp;
  if (timeDelta <= 0) {
    return prevDetections.map(det => ({ ...det, age, persisted: false }));
  }

  const t = (currentTime - prevFrame.frame_timestamp) / timeDelta;
  const smoothT = smoothstep(Math.max(0, Math.min(1, t)));

  const interpolatedDetections: ProcessedDetection[] = [];
  const activeDetectionKeys = new Set<string>();

  // Maximum normalized distance for interpolation (prevents jumps across screen)
  const MAX_INTERPOLATION_DISTANCE = 0.3;

  // Process current frame detections
  for (const prevDet of prevDetections) {
    const matchingNext = findMatchingDetection(
      prevDet,
      nextFrame.detections,
      confidenceThreshold
    );

    // Create a unique key for this detection (include class and size to avoid collisions)
    const detKey = `${prevDet.class}-${Math.round(prevDet.bbox.x * 100)}-${Math.round(prevDet.bbox.y * 100)}-${Math.round(prevDet.bbox.width * 100)}-${Math.round(prevDet.bbox.height * 100)}`;

    if (matchingNext) {
      activeDetectionKeys.add(detKey);
      
      // Calculate distance between detections
      const prevCenterX = prevDet.bbox.x + prevDet.bbox.width / 2;
      const prevCenterY = prevDet.bbox.y + prevDet.bbox.height / 2;
      const nextCenterX = matchingNext.bbox.x + matchingNext.bbox.width / 2;
      const nextCenterY = matchingNext.bbox.y + matchingNext.bbox.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(nextCenterX - prevCenterX, 2) +
        Math.pow(nextCenterY - prevCenterY, 2)
      );

      // Only interpolate if detections are close enough
      if (distance <= MAX_INTERPOLATION_DISTANCE) {
        // Interpolate between the two detections
        const interpolatedBbox = {
          x: lerp(prevDet.bbox.x, matchingNext.bbox.x, smoothT),
          y: lerp(prevDet.bbox.y, matchingNext.bbox.y, smoothT),
          width: lerp(prevDet.bbox.width, matchingNext.bbox.width, smoothT),
          height: lerp(prevDet.bbox.height, matchingNext.bbox.height, smoothT),
        };

        interpolatedDetections.push({
          class: prevDet.class,
          confidence: lerp(prevDet.confidence, matchingNext.confidence, smoothT),
          bbox: interpolatedBbox,
          age: 0,
          persisted: false,
        });
      } else {
        // Too far apart - show old detection fading out
        if (age <= persistenceTime) {
          interpolatedDetections.push({
            ...prevDet,
            age,
            persisted: true,
          });
        }
        
        // If we're close to the next frame, show the next detection appearing
        if (smoothT > 0.5) {
          interpolatedDetections.push({
            ...matchingNext,
            age: 0,
            persisted: false,
          });
        }
      }
    } else {
      // No matching detection in next frame - show with age if within persistence time
      activeDetectionKeys.add(detKey);
      if (age <= persistenceTime) {
        interpolatedDetections.push({
          ...prevDet,
          age,
          persisted: true,
        });
      }
    }
  }

  // Look back through previous frames for detections that should still persist
  // but are no longer in the current prevFrame
  for (let i = prevFrameIdx - 1; i >= 0; i--) {
    const olderFrame = detections[i];
    const frameAge = currentTime - olderFrame.frame_timestamp;
    
    // Stop once we're beyond persistence window
    if (frameAge > persistenceTime) break;
    
    for (const olderDet of olderFrame.detections) {
      if (olderDet.confidence < confidenceThreshold) continue;
      
      // Create key for this detection (include class and size to avoid collisions)
      const detKey = `${olderDet.class}-${Math.round(olderDet.bbox.x * 100)}-${Math.round(olderDet.bbox.y * 100)}-${Math.round(olderDet.bbox.width * 100)}-${Math.round(olderDet.bbox.height * 100)}`;
      
      // Skip if we're already showing this detection from a more recent frame
      if (activeDetectionKeys.has(detKey)) continue;
      
      // Check if this detection appears in any frame between this one and current
      let appearsInRecentFrame = false;
      for (let j = i + 1; j <= prevFrameIdx; j++) {
        const recentFrame = detections[j];
        const match = findMatchingDetection(olderDet, recentFrame.detections, confidenceThreshold);
        if (match) {
          appearsInRecentFrame = true;
          break;
        }
      }
      
      // If it doesn't appear in recent frames, it's truly gone - show it fading
      if (!appearsInRecentFrame) {
        activeDetectionKeys.add(detKey);
        interpolatedDetections.push({
          ...olderDet,
          age: frameAge,
          persisted: true,
        });
      }
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
  persistenceTime = 1.0,
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
      {currentDetections.map((detection, idx) => {
        // Convert normalized coordinates to pixel coordinates
        const x = detection.bbox.x * videoDimensions.width;
        const y = detection.bbox.y * videoDimensions.height;
        const width = detection.bbox.width * videoDimensions.width;
        const height = detection.bbox.height * videoDimensions.height;

        // Color based on confidence
        const baseColor = detection.confidence >= 0.7 ? "#22c55e" : "#eab308";

        // Fade out old detections smoothly to fully transparent
        let opacity = 1;
        if (fadeEnabled && detection.persisted && detection.age > 0) {
          // Fade from 1.0 to 0.0 over the persistence time
          const fadeProgress = Math.min(detection.age / persistenceTime, 1);
          // Apply easing for smooth fade (ease-out cubic)
          const easedFade = 1 - Math.pow(fadeProgress, 2);
          opacity = easedFade;
        }

        // Consistent stroke width for all detections
        const strokeWidth = 2;

        // Dynamic label width based on confidence value
        const confidenceText = `${(detection.confidence * 100).toFixed(0)}%`;
        const labelWidth = confidenceText.length * 6 + 14;
        const labelY = y - 6;

        // Use stable key based on detection properties (not index)
        const detectionKey = `${detection.class}-${Math.round(detection.bbox.x * 1000)}-${Math.round(detection.bbox.y * 1000)}-${Math.round(detection.bbox.width * 1000)}-${Math.round(detection.bbox.height * 1000)}-${detection.persisted ? 'p' : 'a'}-${Math.round(detection.age * 100)}-${idx}`;
        
        return (
          <g key={detectionKey} opacity={opacity}>
            {/* Bounding box */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={baseColor}
              strokeWidth={strokeWidth}
              rx="4"
            />

            {/* Confidence label */}
            <g transform={`translate(${x}, ${labelY})`}>
              <rect
                x="0"
                y="0"
                width={labelWidth}
                height="20"
                fill={baseColor}
                rx="4"
              />
              <text
                x="4"
                y="14"
                fill="#000"
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui"
              >
                {confidenceText}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

