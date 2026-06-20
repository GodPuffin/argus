"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { DETECTIONS_TIMELINE_COLORS } from "@/lib/chart-colors";
import { ChartFootnote, ChartShell } from "./chart-shell";

interface DetectionsTimelineChartProps {
  data: Array<{ date: string; detections: number; frames: number }>;
}

const chartConfig = {
  detections: {
    label: "Detections",
    color: DETECTIONS_TIMELINE_COLORS.detections,
  },
  frames: {
    label: "Frames",
    color: DETECTIONS_TIMELINE_COLORS.frames,
  },
};

export function DetectionsTimelineChart({
  data,
}: DetectionsTimelineChartProps) {
  const chartAnimation = useChartAnimation("detections-timeline");
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const totalDetections = data.reduce((sum, item) => sum + item.detections, 0);
  const totalFrames = data.reduce((sum, item) => sum + item.frames, 0);
  const avgPerFrame =
    totalFrames > 0 ? (totalDetections / totalFrames).toFixed(2) : "0";

  return (
    <ChartShell
      title="Detections Timeline"
      description="Daily detection activity and frame processing"
      isEmpty={chartData.length === 0}
      emptyMessage="No detection timeline data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="detections"
            stroke={chartConfig.detections.color}
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            {...chartAnimation}
          />
          <Line
            type="monotone"
            dataKey="frames"
            stroke={chartConfig.frames.color}
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            {...chartAnimation}
          />
        </LineChart>
      </ChartContainer>
      <ChartFootnote>Average {avgPerFrame} detections per frame</ChartFootnote>
    </ChartShell>
  );
}
