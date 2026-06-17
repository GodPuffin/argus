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
import { EVENT_TYPE_COLORS } from "@/lib/chart-colors";
import { buildDynamicChartConfig, ChartShell } from "./chart-shell";

interface EventTypeChartProps {
  data: Array<{ type: string; count: number }>;
}

export function EventTypeChart({ data }: EventTypeChartProps) {
  const chartAnimation = useChartAnimation("event-type");
  const chartData = data.slice(0, 8).map((item, index) => ({
    type: item.type,
    count: item.count,
    fill: EVENT_TYPE_COLORS[index % EVENT_TYPE_COLORS.length],
  }));

  const chartConfig = buildDynamicChartConfig(
    chartData,
    (item) => item.type,
    (item) => item.fill,
  );

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartShell
      title="Event Types"
      description={
        total > 0
          ? `Distribution of ${total.toLocaleString()} events by type`
          : "No events yet"
      }
      isEmpty={chartData.length === 0}
      emptyMessage="No event type data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={chartData} margin={{ left: 10, right: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="type"
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
              <Cell key={entry.type} fill={entry.fill} />
            ))}
          </Bar>
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}
