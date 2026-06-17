"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { DETECTION_CLASS_COLORS } from "@/lib/chart-colors";
import { ChartShell } from "./chart-shell";

interface DetectionClassChartProps {
  data: Array<{ class: string; count: number }>;
}

export function DetectionClassChart({ data }: DetectionClassChartProps) {
  const chartAnimation = useChartAnimation("detection-class");
  const chartData = data.map((item, index) => ({
    name: item.class,
    value: item.count,
    fill: DETECTION_CLASS_COLORS[index % DETECTION_CLASS_COLORS.length],
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartShell
      title="Object Detection Classes"
      description={
        total > 0 ? `Total ${total.toLocaleString()} detections` : "No detections yet"
      }
      isEmpty={total === 0}
      emptyMessage="No detection data available"
    >
      <ChartContainer
        config={{}}
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
