"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { ChartShell } from "./chart-shell";

interface DetectionsByHourChartProps {
  data: Array<{ timestamp: number; count: number }>;
}

const chartConfig = {
  count: {
    label: "Detections",
    color: "hsl(10, 85%, 62%)",
  },
};

export function DetectionsByHourChart({ data }: DetectionsByHourChartProps) {
  const chartAnimation = useChartAnimation("detections-by-hour");
  const hourlyData = new Map<number, number>();
  for (const item of data) {
    const hour = new Date(item.timestamp * 1000).getHours();
    hourlyData.set(hour, (hourlyData.get(hour) || 0) + item.count);
  }

  const chartData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    count: hourlyData.get(i) || 0,
  }));

  return (
    <ChartShell
      title="Detections by Hour"
      description="Hourly detection patterns over time"
      isEmpty={data.length === 0}
      emptyMessage="No hourly data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="hour"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey="count"
            fill={chartConfig.count.color}
            radius={[4, 4, 0, 0]}
            {...chartAnimation}
          />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}
