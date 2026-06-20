"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { STREAM_STATUS_COLORS } from "@/lib/chart-colors";
import { ChartShell } from "./chart-shell";

interface StreamStatusChartProps {
  data: {
    active: number;
    idle: number;
    disabled: number;
  };
}

const chartConfig = {
  active: { label: "Active", color: STREAM_STATUS_COLORS.active },
  idle: { label: "Idle", color: STREAM_STATUS_COLORS.idle },
  disabled: { label: "Disabled", color: STREAM_STATUS_COLORS.disabled },
};

export function StreamStatusChart({ data }: StreamStatusChartProps) {
  const chartAnimation = useChartAnimation("stream-status");
  const chartData = [
    { name: "Active", value: data.active, fill: chartConfig.active.color },
    { name: "Idle", value: data.idle, fill: chartConfig.idle.color },
    { name: "Disabled", value: data.disabled, fill: chartConfig.disabled.color },
  ].filter((item) => item.value > 0);

  const total = data.active + data.idle + data.disabled;

  return (
    <ChartShell
      title="Stream Status"
      description={total > 0 ? `Total ${total} streams` : "No streams configured"}
      isEmpty={total === 0}
      emptyMessage="No stream data available"
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
            paddingAngle={2}
            {...chartAnimation}
          />
        </PieChart>
      </ChartContainer>
    </ChartShell>
  );
}
