"use client";

import { IconClock, IconPlayerPlay } from "@tabler/icons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface EventCardProps {
  asset_id: string;
  event_id: number;
  name: string;
  description: string;
  severity: "Minor" | "Medium" | "High";
  type: string;
  timestamp_seconds: number;
  affected_entities?: any[];
}

const formatDuration = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getSeverityColor = (severity: "Minor" | "Medium" | "High"): string => {
  const colors = {
    High: "border-l-red-500",
    Medium: "border-l-yellow-500",
    Minor: "border-l-blue-500",
  };
  return colors[severity] || "border-l-gray-500";
};

const getSeverityBadgeClass = (
  severity: "Minor" | "Medium" | "High",
): string => {
  const classes = {
    High: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20 hover:bg-red-500/20",
    Medium:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20",
    Minor:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20",
  };
  return classes[severity] || "";
};

export const EventCard = ({
  asset_id,
  event_id,
  name,
  description,
  severity,
  type,
  timestamp_seconds,
  affected_entities,
}: EventCardProps) => {
  const videoUrl = `/watch/${asset_id}?timestamp=${timestamp_seconds}`;

  return (
    <Link href={videoUrl} className="block no-underline">
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg border-l-4 py-0",
          getSeverityColor(severity),
          "not-prose",
        )}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with badges and timestamp */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={severity === "High" ? "destructive" : "secondary"}
                className={cn("text-xs", getSeverityBadgeClass(severity))}
              >
                {severity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {type}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconClock className="size-3" />
                <span>{formatDuration(timestamp_seconds)}</span>
              </div>
            </div>

            {/* Event name and description */}
            <div>
              <h3 className="font-semibold text-sm mb-1">{name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>

            {/* Affected entities */}
            {affected_entities && affected_entities.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Involved:</span>
                {affected_entities
                  .slice(0, 3)
                  .map((entity: any, idx: number) => {
                    const entityName =
                      entity.label || entity.name || entity.type || "Unknown";
                    return (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {entityName}
                      </Badge>
                    );
                  })}
                {affected_entities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{affected_entities.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Play button hint */}
            <div className="flex items-center gap-1 text-xs text-primary">
              <IconPlayerPlay className="size-3" />
              <span>Click to watch at {formatDuration(timestamp_seconds)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
