"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAnalysisJob } from "@/lib/supabase";
import Link from "next/link";
import { IconExclamationCircle, IconReportAnalytics } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

function getStatusVariant(
  status: AIAnalysisJob["status"]
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

function formatDuration(startEpoch: number, endEpoch: number, sourceType: string): string {
  if (sourceType === "vod") {
    // For VOD, these are relative seconds
    return `${startEpoch}s - ${endEpoch}s`;
  } else {
    // For live, these are Unix epochs
    const duration = endEpoch - startEpoch;
    return `${duration}s segment`;
  }
}

export const columns: ColumnDef<AIAnalysisJob>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Job ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-mono text-sm">#{row.getValue("id")}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
        <div className="font-mono text-xs max-w-[150px] truncate" title={sourceId}>
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
          {formatDuration(startEpoch, endEpoch, sourceType)}
        </div>
      );
    },
  },
  {
    accessorKey: "attempts",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Attempts
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const attempts = row.getValue("attempts") as number;
      return (
        <div className={`text-center ${attempts > 1 ? "text-yellow-600 dark:text-yellow-500 font-semibold" : ""}`}>
          {attempts}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatTimestamp(row.getValue("created_at"))}
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatTimestamp(row.getValue("updated_at"))}
        </div>
      );
    },
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
                <a href={`/watch/${sourceId}?timestamp=${startSeconds}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" />
                  Open in New Tab
                </a>
              </DropdownMenuItem>
              {job.status === "succeeded" && job.result_ref && (
                <DropdownMenuItem asChild>
                  <a href={`/api/ai-analysis/results/${sourceId}`} target="_blank" rel="noopener noreferrer">
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

