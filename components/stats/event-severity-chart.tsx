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
import { getSeverityChartColor } from "@/lib/severity-styles";
import { ChartShell } from "./chart-shell";

interface EventSeverityChartProps {
  data: Array<{ severity: string; count: number }>;
}

const chartConfig = {
  High: { label: "High", color: getSeverityChartColor("High") },
  Medium: { label: "Medium", color: getSeverityChartColor("Medium") },
  Minor: { label: "Minor", color: getSeverityChartColor("Minor") },
};

export function EventSeverityChart({ data }: EventSeverityChartProps) {
  const chartAnimation = useChartAnimation("event-severity");
  const chartData = data.map((item) => ({
    name: item.severity,
    value: item.count,
    fill:
      chartConfig[item.severity as keyof typeof chartConfig]?.color ||
      "hsl(var(--muted))",
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartShell
      title="Event Severity Distribution"
      description={
        total > 0 ? `Total ${total.toLocaleString()} events` : "No events yet"
      }
      isEmpty={total === 0}
      emptyMessage="No event data available"
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
