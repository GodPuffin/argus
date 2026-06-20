"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { getColorblindSafeColor } from "@/lib/chart-colors";
import { buildDynamicChartConfig, ChartShell } from "./chart-shell";

interface CameraActivityChartProps {
  data: Array<{ camera_name: string; event_count: number; camera_id: string }>;
}

export function CameraActivityChart({ data }: CameraActivityChartProps) {
  const chartAnimation = useChartAnimation("camera-activity");
  const chartData = data.slice(0, 10).map((item, index) => ({
    camera: item.camera_name,
    jobs: item.event_count,
    fill: getColorblindSafeColor(index),
  }));

  const chartConfig = buildDynamicChartConfig(
    chartData,
    (item) => item.camera,
    (item) => item.fill,
  );

  const total = data.reduce((sum, item) => sum + item.event_count, 0);

  return (
    <ChartShell
      title="Camera Analysis Activity"
      description={
        total > 0
          ? `AI jobs processed per camera (${total.toLocaleString()} total)`
          : "No camera activity yet"
      }
      isEmpty={chartData.length === 0}
      emptyMessage="No camera activity data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            dataKey="camera"
            type="category"
            width={120}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="jobs" radius={[0, 4, 4, 0]} {...chartAnimation}>
            {chartData.map((entry) => (
              <Cell key={entry.camera} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}
