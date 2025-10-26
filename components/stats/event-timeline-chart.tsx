"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LuxeCard as Card,
  LuxeCardContent as CardContent,
  LuxeCardDescription as CardDescription,
  LuxeCardHeader as CardHeader,
  LuxeCardTitle as CardTitle,
} from "@/components/ui/luxe-card";
import { ChartBackground } from "./chart-background";

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
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Event Timeline</CardTitle>
        <CardDescription>Daily event detection trends</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {chartData.length > 0 ? (
            <>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData} margin={{ left: 0, right: 10 }}>
                  <defs>
                    <linearGradient
                      id="fillEventCount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    animationDuration={800}
                  />
                </AreaChart>
              </ChartContainer>
              <div className="mt-3 flex items-center gap-2 text-sm px-2 pb-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">
                  Avg {avgPerDay} events per day
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No timeline data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  );
}
