"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatClockDuration, relativeTime } from "@/lib/format";
import type {
  AIAnalysisEvent,
  AIAnalysisJob,
  Asset,
  Camera,
} from "@/lib/supabase";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  succeeded: "default",
  ready: "default",
  idle: "secondary",
  queued: "secondary",
  processing: "secondary",
  disabled: "outline",
  failed: "outline",
};

const severityClass: Record<string, string> = {
  High: "bg-red-500/15 text-red-500 border-red-500/30",
  Medium:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Minor: "bg-muted text-muted-foreground border-border",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant[status] ?? "outline"}>{status}</Badge>;
}

function MonoId({ value }: { value: string | number }) {
  return (
    <span className="font-mono text-xs text-muted-foreground">{value}</span>
  );
}

export const cameraColumns: ColumnDef<Camera>[] = [
  { accessorKey: "camera_name", header: "Name" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "last_connected_at",
    header: "Last connected",
    cell: ({ row }) => relativeTime(row.original.last_connected_at),
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <MonoId value={row.original.id} />,
  },
];

export const assetColumns: ColumnDef<Asset>[] = [
  {
    id: "title",
    header: "Title",
    accessorFn: (a) => a.meta?.title ?? a.id,
    cell: ({ row }) => row.original.meta?.title ?? row.original.id,
  },
  {
    accessorKey: "duration_seconds",
    header: "Duration",
    cell: ({ row }) => formatClockDuration(row.original.duration_seconds),
  },
  { accessorKey: "resolution_tier", header: "Resolution" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => relativeTime(row.original.created_at),
  },
];

export const eventColumns: ColumnDef<AIAnalysisEvent>[] = [
  { accessorKey: "name", header: "Event" },
  { accessorKey: "type", header: "Type" },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${severityClass[row.original.severity]}`}
      >
        {row.original.severity}
      </span>
    ),
  },
  {
    accessorKey: "asset_id",
    header: "Asset",
    cell: ({ row }) => <MonoId value={row.original.asset_id} />,
  },
  {
    accessorKey: "created_at",
    header: "Detected",
    cell: ({ row }) => relativeTime(row.original.created_at),
  },
];

export const jobColumns: ColumnDef<AIAnalysisJob>[] = [
  {
    accessorKey: "id",
    header: "Job",
    cell: ({ row }) => (
      <span className="font-mono text-xs">#{row.original.id}</span>
    ),
  },
  { accessorKey: "source_type", header: "Source" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  { accessorKey: "attempts", header: "Attempts" },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => relativeTime(row.original.created_at),
  },
];
