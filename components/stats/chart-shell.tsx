import type * as React from "react";
import type { ChartConfig } from "@/components/ui/chart";
import {
  LuxeCard as Card,
  LuxeCardContent as CardContent,
  LuxeCardDescription as CardDescription,
  LuxeCardHeader as CardHeader,
  LuxeCardTitle as CardTitle,
} from "@/components/ui/luxe-card";
import { cn } from "@/lib/utils";
import { ChartBackground } from "./chart-background";

interface ChartShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** When true, the empty placeholder is shown instead of `children`. */
  isEmpty: boolean;
  /** Message shown in the empty placeholder. */
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * Shared frame for every dashboard chart: a revealed-pointer card with a
 * header, the framed chart background, and a consistent empty state. Individual
 * charts only supply their title, copy, an `isEmpty` flag, and the chart body.
 */
export function ChartShell({
  title,
  description,
  isEmpty,
  emptyMessage = "No data available",
  className,
  contentClassName,
  children,
}: ChartShellProps) {
  return (
    <Card variant="revealed-pointer" className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("pb-6", contentClassName)}>
        <ChartBackground>
          {isEmpty ? <EmptyChartState message={emptyMessage} /> : children}
        </ChartBackground>
      </CardContent>
    </Card>
  );
}

/** Centered placeholder filling a chart's footprint when there is no data. */
export function EmptyChartState({
  message = "No data available",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[300px] items-center justify-center text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}

/**
 * Single-line summary shown beneath a chart, e.g. "Avg 12 events per day".
 * Pass an already-styled `icon` element; multi-stat footers stay bespoke.
 */
export function ChartFootnote({
  icon,
  className,
  children,
}: {
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex items-center gap-2 px-2 pb-2 text-sm",
        className,
      )}
    >
      {icon}
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

/**
 * Builds a Recharts `ChartConfig` from a row set whose categories are only
 * known at runtime (camera names, tags, entities, …). `getKey` names each
 * series and `getColor` supplies its swatch.
 */
export function buildDynamicChartConfig<T>(
  rows: T[],
  getKey: (row: T) => string,
  getColor: (row: T) => string,
): ChartConfig {
  return rows.reduce<ChartConfig>((acc, row) => {
    const key = getKey(row);
    acc[key] = { label: key, color: getColor(row) };
    return acc;
  }, {});
}
