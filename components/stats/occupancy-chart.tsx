"use client";

import { Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { OCCUPANCY_COLOR } from "@/lib/chart-colors";
import { ChartShell } from "./chart-shell";

interface OccupancyChartProps {
  data: Array<{ timestamp: number; count: number }>;
}

const chartConfig = {
  count: {
    label: "Detected",
    color: OCCUPANCY_COLOR,
  },
};

export function OccupancyChart({ data }: OccupancyChartProps) {
  const chartAnimation = useChartAnimation("occupancy");
  // Thin the series to ~100 points so dense streams stay legible.
  const sampleRate = Math.max(1, Math.floor(data.length / 100));
  const sampledData = data.filter((_, index) => index % sampleRate === 0);

  const timestamps = sampledData.map((d) => d.timestamp * 1000);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const spansDays = maxTime - minTime > 24 * 60 * 60 * 1000;

  // Multi-day spans need the date on each tick; single-day spans show time only.
  const chartData = sampledData.map((item) => {
    const date = new Date(item.timestamp * 1000);
    const time = spansDays
      ? date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
    return { time, count: item.count };
  });

  const maxOccupancy = Math.max(...data.map((d) => d.count), 0);
  const avgOccupancy =
    data.length > 0
      ? (data.reduce((sum, d) => sum + d.count, 0) / data.length).toFixed(1)
      : "0";

  return (
    <ChartShell
      title="Occupancy Over Time"
      description="People count detected in video streams"
      isEmpty={chartData.length === 0}
      emptyMessage="No occupancy data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={chartData} margin={{ left: 0, right: 10 }}>
          <defs>
            <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={chartConfig.count.color}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={chartConfig.count.color}
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStartEnd"
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={chartConfig.count.color}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#fillCount)"
            {...chartAnimation}
          />
        </AreaChart>
      </ChartContainer>
      <div className="mt-3 flex items-center gap-4 px-2 pb-2 text-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Avg: {avgOccupancy} people</span>
        </div>
        <span className="text-muted-foreground">Peak: {maxOccupancy} people</span>
      </div>
    </ChartShell>
  );
}
