"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartAnimation } from "@/hooks/use-chart-animation";
import { ChartFootnote, ChartShell } from "./chart-shell";

interface EventTimelineChartProps {
  data: Array<{ date: string; count: number }>;
}

const chartConfig = {
  count: {
    label: "Events",
    color: "hsl(0, 80%, 60%)",
  },
};

export function EventTimelineChart({ data }: EventTimelineChartProps) {
  const chartAnimation = useChartAnimation("event-timeline");
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const avgPerDay = data.length > 0 ? (total / data.length).toFixed(1) : "0";

  return (
    <ChartShell
      title="Event Timeline"
      description="Daily event detection trends"
      isEmpty={chartData.length === 0}
      emptyMessage="No timeline data available"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={chartData} margin={{ left: 0, right: 10 }}>
          <defs>
            <linearGradient id="fillEventCount" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={chartConfig.count.color}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={chartConfig.count.color}
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={chartConfig.count.color}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#fillEventCount)"
            {...chartAnimation}
          />
        </AreaChart>
      </ChartContainer>
      <ChartFootnote icon={<TrendingUp className="h-4 w-4 text-red-500" />}>
        Avg {avgPerDay} events per day
      </ChartFootnote>
    </ChartShell>
  );
}
