"use client";

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
import { ChartBackground } from "./chart-background";

interface AssetDurationChartProps {
  data: Array<{ range: string; count: number }>;
}

const chartConfig = {
  count: {
    label: "Recordings",
    color: "hsl(195, 68%, 62%)",
  },
};

export function AssetDurationChart({ data }: AssetDurationChartProps) {
  const chartData = data.map((item) => ({
    range: item.range,
    count: item.count,
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 0);

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Recording Length Distribution</CardTitle>
        <CardDescription>
          {total > 0
            ? `Duration breakdown of ${total.toLocaleString()} recordings`
            : "No recording data yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="range"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={chartConfig.count.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: chartConfig.count.color }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No recording duration data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  );
}
