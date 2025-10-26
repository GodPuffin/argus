"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCriticalEventsRealtime } from "@/hooks/use-critical-events-realtime";
import type { AIAnalysisEvent } from "@/lib/supabase";

/**
 * Global monitor for critical events
 * Shows toast notifications when high-severity events are detected
 */
export function CriticalEventsMonitor() {
  const { events } = useCriticalEventsRealtime();
  const router = useRouter();
  const shownEventIds = useRef(new Set<number>());

  useEffect(() => {
    // Check for new events that haven't been shown yet
    for (const event of events) {
      if (!shownEventIds.current.has(event.id)) {
        shownEventIds.current.add(event.id);

        // Don't show toast for events that existed before this session
        // Only show for truly new events (compare created_at with current time)
        const eventTime = new Date(event.created_at).getTime();
        const now = Date.now();
        const isRecent = now - eventTime < 5000; // Only show if created in last 5 seconds

        if (isRecent) {
          showCriticalEventToast(event, router);
        }
      }
    }
  }, [events, router]);

  return null; // This component doesn't render anything
}

function showCriticalEventToast(
  event: AIAnalysisEvent,
  router: ReturnType<typeof useRouter>,
) {
  toast.warning(
    <div className="flex flex-col gap-2 max-w-sm">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeStyles(event.severity)}`}
        >
          {event.severity}
        </span>
        <div className="font-semibold">{event.name}</div>
      </div>
      <div className="text-sm text-muted-foreground line-clamp-2">
        {event.description}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(event.timestamp_seconds)}
        </span>
        <button
          onClick={() => {
            router.push(
              `/watch/${event.asset_id}?timestamp=${event.timestamp_seconds}`,
            );
          }}
          className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View Video
        </button>
      </div>
    </div>,
    {
      duration: 8000,
    },
  );
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    High: "text-red-600 dark:text-red-400",
    Medium: "text-yellow-600 dark:text-yellow-400",
    Minor: "text-gray-600 dark:text-gray-400",
  };
  return colors[severity] || "text-gray-600";
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getSeverityBadgeStyles(severity: string): string {
  const styles: Record<string, string> = {
    High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Minor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };
  return (
    styles[severity] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  );
}
