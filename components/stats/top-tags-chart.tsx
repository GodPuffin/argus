"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { getTagColor } from "@/lib/chart-colors";
import { buildDynamicChartConfig, ChartShell } from "./chart-shell";

interface TopTagsChartProps {
  data: Array<{ tag: string; count: number }>;
}

export function TopTagsChart({ data }: TopTagsChartProps) {
  const chartAnimation = useChartAnimation("top-tags");
  const chartData = data.slice(0, 10).map((item) => ({
    tag: item.tag,
    count: item.count,
    fill: getTagColor(item.tag),
  }));

  const chartConfig = buildDynamicChartConfig(
    chartData,
    (item) => item.tag,
    (item) => item.fill,
  );

  return (
    <ChartShell
      title="Top AI Analysis Tags"
      description="Most common tags from AI analysis results"
      isEmpty={chartData.length === 0}
      emptyMessage="No tag data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={chartData} margin={{ left: 10, right: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="tag"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} {...chartAnimation}>
            {chartData.map((entry) => (
              <Cell key={entry.tag} fill={entry.fill} />
            ))}
          </Bar>
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}
