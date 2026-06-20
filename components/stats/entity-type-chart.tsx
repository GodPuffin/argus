"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { ENTITY_TYPE_COLORS, getEntityTypeColor } from "@/lib/chart-colors";
import { ChartShell } from "./chart-shell";

interface EntityTypeChartProps {
  data: Array<{ type: string; count: number }>;
}

const chartConfig = {
  person: { label: "Person", color: ENTITY_TYPE_COLORS.person },
  object: { label: "Object", color: ENTITY_TYPE_COLORS.object },
  location: { label: "Location", color: ENTITY_TYPE_COLORS.location },
  vehicle: { label: "Vehicle", color: ENTITY_TYPE_COLORS.vehicle },
  animal: { label: "Animal", color: ENTITY_TYPE_COLORS.animal },
  unknown: { label: "Unknown", color: ENTITY_TYPE_COLORS.unknown },
};

export function EntityTypeChart({ data }: EntityTypeChartProps) {
  const chartAnimation = useChartAnimation("entity-type");
  const chartData = data.map((item) => ({
    name: item.type,
    value: item.count,
    fill: getEntityTypeColor(item.type),
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartShell
      title="Entity Type Distribution"
      description={
        total > 0
          ? `Total ${total.toLocaleString()} entities detected`
          : "No entities yet"
      }
      isEmpty={total === 0}
      emptyMessage="No entity data available"
    >
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[300px] w-full"
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            strokeWidth={2}
            stroke="hsl(var(--background))"
            label={({ name, percent }) =>
              percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
            }
            labelLine={false}
            {...chartAnimation}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ChartContainer>
    </ChartShell>
  );
}
