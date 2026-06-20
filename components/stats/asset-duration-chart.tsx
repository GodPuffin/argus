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
import { ChartShell } from "./chart-shell";

interface AssetDurationChartProps {
  data: Array<{ range: string; count: number }>;
}

const chartConfig = {
  count: {
    label: "Recordings",
    color: "hsl(195, 68%, 62%)",
  },
};

export function AssetDurationChart({ data }: AssetDurationChartProps) {
  const chartAnimation = useChartAnimation("asset-duration");
  const chartData = data.map((item) => ({
    range: item.range,
    count: item.count,
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartShell
      title="Recording Length Distribution"
      description={
        total > 0
          ? `Duration breakdown of ${total.toLocaleString()} recordings`
          : "No recording data yet"
      }
      isEmpty={chartData.length === 0}
      emptyMessage="No recording duration data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="range"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={chartConfig.count.color}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: chartConfig.count.color }}
            activeDot={{ r: 6 }}
            {...chartAnimation}
          />
        </LineChart>
      </ChartContainer>
    </ChartShell>
  );
}
