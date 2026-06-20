"use client";

import {
  IconExclamationCircle,
  IconReportAnalytics,
} from "@tabler/icons-react";
import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import { ArrowUpDown, Copy, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AIAnalysisJob } from "@/lib/supabase";

function getStatusVariant(
  status: AIAnalysisJob["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "succeeded":
      return "default";
    case "processing":
      return "secondary";
    case "queued":
      return "outline";
    case "failed":
    case "dead":
      return "destructive";
    default:
      return "outline";
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTimeWindow(
  startEpoch: number,
  endEpoch: number,
  sourceType: string,
): string {
  // VOD stores relative seconds; live stores Unix epochs.
  if (sourceType === "vod") {
    return `${startEpoch}s - ${endEpoch}s`;
  }
  return `${endEpoch - startEpoch}s segment`;
}

/** Header renderer for a sortable column: a ghost button that toggles sorting. */
function sortableHeader(label: string) {
  return function SortableColumnHeader({
    column,
  }: HeaderContext<AIAnalysisJob, unknown>) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  };
}

export const columns: ColumnDef<AIAnalysisJob>[] = [
  {
    accessorKey: "id",
    header: sortableHeader("Job ID"),
    cell: ({ row }) => (
      <div className="font-mono text-sm">#{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: sortableHeader("Status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as AIAnalysisJob["status"];
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "source_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("source_type") as string;
      return (
        <Badge variant="outline" className="uppercase">
          {type}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "source_id",
    header: "Source",
    cell: ({ row }) => {
      const sourceId = row.getValue("source_id") as string;
      return (
        <div
          className="font-mono text-xs max-w-[150px] truncate"
          title={sourceId}
        >
          {sourceId}
        </div>
      );
    },
  },
  {
    id: "time_window",
    header: "Time Window",
    cell: ({ row }) => {
      const startEpoch = row.original.start_epoch;
      const endEpoch = row.original.end_epoch;
      const sourceType = row.original.source_type;
      return (
        <div className="text-sm">
          {formatTimeWindow(startEpoch, endEpoch, sourceType)}
        </div>
      );
    },
  },
  {
    id: "models",
    header: "Models",
    cell: ({ row }) => {
      const models = row.original.models ?? [];
      if (models.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex max-w-[260px] flex-wrap gap-1">
          {models.map((m) => (
            <Badge key={m} variant="secondary" className="text-[10px]">
              {m.split(/[:—]/)[0].trim()}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "attempts",
    header: sortableHeader("Attempts"),
    cell: ({ row }) => {
      const attempts = row.getValue("attempts") as number;
      return (
        <div
          className={`text-center ${attempts > 1 ? "text-yellow-600 dark:text-yellow-500 font-semibold" : ""}`}
        >
          {attempts}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: sortableHeader("Created"),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatTimestamp(row.getValue("created_at"))}
      </div>
    ),
  },
  {
    accessorKey: "updated_at",
    header: sortableHeader("Updated"),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatTimestamp(row.getValue("updated_at"))}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original;
      const sourceId = job.source_id;
      const startSeconds = job.asset_start_seconds ?? job.start_epoch;

      const copySourceId = () => {
        navigator.clipboard.writeText(sourceId);
        toast.success("Source ID copied to clipboard");
      };

      const copyJobId = () => {
        navigator.clipboard.writeText(job.id.toString());
        toast.success("Job ID copied to clipboard");
      };

      return (
        <div className="flex items-center gap-1">
          {job.status === "succeeded" && job.result_ref ? (
            <Link href={`/api/ai-analysis/results/${sourceId}`} target="_blank">
              <Button variant="outline" size="sm">
                <IconReportAnalytics className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="destructive" size="sm" disabled>
              <IconExclamationCircle className="h-4 w-4" />
            </Button>
          )}
          <Link href={`/watch/${sourceId}?timestamp=${startSeconds}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={copyJobId}>
                <Copy className="h-4 w-4" />
                Copy Job ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copySourceId}>
                <Copy className="h-4 w-4" />
                Copy Source ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href={`/watch/${sourceId}?timestamp=${startSeconds}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="h-4 w-4" />
                  Open in New Tab
                </a>
              </DropdownMenuItem>
              {job.status === "succeeded" && job.result_ref && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/api/ai-analysis/results/${sourceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconReportAnalytics className="h-4 w-4" />
                    View Results API
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
