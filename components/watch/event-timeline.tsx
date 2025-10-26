"use client";

import { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AIAnalysisEvent } from "@/lib/supabase";

interface EventTimelineProps {
  events: AIAnalysisEvent[];
  duration: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

/**
 * Interactive timeline scrubber with event markers
 * Click or drag to seek through video, hover events for details
 */
export function EventTimeline({
  events,
  duration,
  currentTime,
  onSeek,
}: EventTimelineProps) {
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  if (!duration || duration === 0) {
    return null;
  }

  const handleSeekFromPosition = (clientX: number) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width),
    );
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSeekFromPosition(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleSeekFromPosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    handleSeekFromPosition(e.clientX);
  };

  return (
    <div className="relative w-full">
      {/* Main scrubber with overlaid event markers */}
      <div
        ref={timelineRef}
        className="relative w-full h-8 cursor-pointer group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      >
        {/* Background track */}
        <div className="absolute inset-0 bg-muted/30 rounded-md" />

        {/* Progress bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-primary/40 rounded-md transition-all"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />

        {/* Event markers layer - overlaid on scrubber */}
        {events.length > 0 && (
          <TooltipProvider delayDuration={200}>
            {events.map((event) => {
              const position = (event.timestamp_seconds / duration) * 100;
              const color = getSeverityColor(event.severity);
              const isHovered = hoveredEvent === event.id;

              return (
                <Tooltip key={event.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`absolute top-0 bottom-0 w-1 cursor-pointer transition-all hover:w-2 ${color} ${
                        isHovered ? "z-20 w-2" : "z-10"
                      } rounded-sm`}
                      style={{ left: `${position}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(event.timestamp_seconds);
                      }}
                      onMouseEnter={() => setHoveredEvent(event.id)}
                      onMouseLeave={() => setHoveredEvent(null)}
                      aria-label={`Jump to ${event.name} at ${formatTimestamp(event.timestamp_seconds)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${getTextColor(event.severity)}`}
                        >
                          {event.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(event.timestamp_seconds)}
                        </span>
                      </div>
                      <div className="font-semibold">{event.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.type}
                      </div>
                      {event.description && (
                        <div className="text-xs mt-1">{event.description}</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        )}

        {/* Playhead thumb - on top of everything */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-3 h-8 bg-primary rounded-sm shadow-lg z-30 transition-transform group-hover:scale-110"
          style={{
            left: `${(currentTime / duration) * 100}%`,
            marginLeft: "-2px",
          }}
        />
      </div>
    </div>
  );
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    High: "bg-red-500 hover:bg-red-600",
    Medium: "bg-cyan-500 hover:bg-cyan-600",
    Minor: "bg-gray-400 hover:bg-gray-500",
  };
  return colors[severity] || "bg-gray-400";
}

function getTextColor(severity: string): string {
  const colors: Record<string, string> = {
    High: "text-red-500",
    Medium: "text-cyan-500",
    Minor: "text-gray-500",
  };
  return colors[severity] || "text-gray-500";
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
