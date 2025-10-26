"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
import { JOBS_TIMELINE_COLORS } from "@/lib/chart-colors";
import { ChartBackground } from "./chart-background";

interface JobsTimelineChartProps {
  data: Array<{
    date: string;
    created: number;
    succeeded: number;
    failed: number;
  }>;
}

const chartConfig = {
  created: {
    label: "Created",
    color: JOBS_TIMELINE_COLORS.created,
  },
  succeeded: {
    label: "Succeeded",
    color: JOBS_TIMELINE_COLORS.succeeded,
  },
  failed: {
    label: "Failed",
    color: JOBS_TIMELINE_COLORS.failed,
  },
};

export function JobsTimelineChart({ data }: JobsTimelineChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const totalCreated = data.reduce((sum, item) => sum + item.created, 0);
  const totalSucceeded = data.reduce((sum, item) => sum + item.succeeded, 0);
  const successRate =
    totalCreated > 0 ? ((totalSucceeded / totalCreated) * 100).toFixed(1) : "0";

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Jobs Timeline</CardTitle>
        <CardDescription>
          Daily job creation and completion trends
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {chartData.length > 0 ? (
            <>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke={chartConfig.created.color}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="succeeded"
                    stroke={chartConfig.succeeded.color}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke={chartConfig.failed.color}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                    animationDuration={800}
                  />
                </LineChart>
              </ChartContainer>
              <div className="mt-3 flex items-center gap-2 text-sm px-2 pb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  {successRate}% success rate
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
