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
import { getEntityTypeColor } from "@/lib/chart-colors";
import { buildDynamicChartConfig, ChartShell } from "./chart-shell";

interface TopEntitiesChartProps {
  data: Array<{ entity: string; count: number; type?: string }>;
}

export function TopEntitiesChart({ data }: TopEntitiesChartProps) {
  const chartAnimation = useChartAnimation("top-entities");
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const topData = data.slice(0, 10).map((item) => ({
    entity: item.entity,
    count: item.count,
    fill: item.type ? getEntityTypeColor(item.type) : "hsl(0, 0%, 50%)",
  }));

  const chartConfig = buildDynamicChartConfig(
    topData,
    (item) => item.entity,
    (item) => item.fill,
  );

  return (
    <ChartShell
      title="Top Detected Entities"
      description={
        total > 0
          ? `Most frequently detected entities (${total.toLocaleString()} total)`
          : "No entities yet"
      }
      isEmpty={topData.length === 0}
      emptyMessage="No entity data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={topData} layout="vertical" margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            dataKey="entity"
            type="category"
            width={100}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} {...chartAnimation}>
            {topData.map((entry) => (
              <Cell key={entry.entity} fill={entry.fill} />
            ))}
          </Bar>
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}
