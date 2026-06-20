"use client";

import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { PROCESSING_VOLUME_COLOR } from "@/lib/chart-colors";
import { ChartFootnote, ChartShell } from "./chart-shell";

interface ProcessingVolumeChartProps {
  data: Array<{ date: string; volume: number }>;
}

const chartConfig = {
  volume: {
    label: "Processing Volume",
    color: PROCESSING_VOLUME_COLOR,
  },
};

export function ProcessingVolumeChart({ data }: ProcessingVolumeChartProps) {
  const chartAnimation = useChartAnimation("processing-volume");
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    volume: item.volume,
  }));

  const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
  const avgDaily =
    data.length > 0 ? (totalVolume / data.length).toFixed(1) : "0";

  return (
    <ChartShell
      title="Processing Volume"
      description="Daily analysis job completion trends"
      isEmpty={chartData.length === 0}
      emptyMessage="No processing volume data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={chartData} margin={{ left: 0, right: 10 }}>
          <defs>
            <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={chartConfig.volume.color}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={chartConfig.volume.color}
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="volume"
            stroke={chartConfig.volume.color}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#fillVolume)"
            {...chartAnimation}
          />
        </AreaChart>
      </ChartContainer>
      <ChartFootnote icon={<Activity className="h-4 w-4 text-muted-foreground" />}>
        Average {avgDaily} jobs per day
      </ChartFootnote>
    </ChartShell>
  );
}
