"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { JOB_STATUS_COLORS } from "@/lib/chart-colors";
import { ChartShell } from "./chart-shell";

interface JobStatusChartProps {
  data: {
    queued: number;
    processing: number;
    succeeded: number;
    failed: number;
    dead: number;
  };
}

const chartConfig = {
  queued: { label: "Queued", color: JOB_STATUS_COLORS.queued },
  processing: { label: "Processing", color: JOB_STATUS_COLORS.processing },
  succeeded: { label: "Succeeded", color: JOB_STATUS_COLORS.succeeded },
  failed: { label: "Failed", color: JOB_STATUS_COLORS.failed },
  dead: { label: "Dead", color: JOB_STATUS_COLORS.dead },
};

export function JobStatusChart({ data }: JobStatusChartProps) {
  const chartAnimation = useChartAnimation("job-status");
  const chartData = [
    { name: "Queued", value: data.queued, fill: chartConfig.queued.color },
    {
      name: "Processing",
      value: data.processing,
      fill: chartConfig.processing.color,
    },
    {
      name: "Succeeded",
      value: data.succeeded,
      fill: chartConfig.succeeded.color,
    },
    { name: "Failed", value: data.failed, fill: chartConfig.failed.color },
    { name: "Dead", value: data.dead, fill: chartConfig.dead.color },
  ].filter((item) => item.value > 0);

  const total =
    data.queued + data.processing + data.succeeded + data.failed + data.dead;

  return (
    <ChartShell
      title="AI Job Status Distribution"
      description={total > 0 ? `Total ${total.toLocaleString()} jobs` : "No jobs yet"}
      isEmpty={total === 0}
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
        </PieChart>
      </ChartContainer>
    </ChartShell>
  );
}
