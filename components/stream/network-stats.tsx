"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface NetworkStatsProps {
  dataRate: number;
  dataHistory: Array<{ time: string; rate: number }>;
  streaming: boolean;
}

const chartConfig = {
  rate: {
    label: "KB/s",
    color: "#06b6d4",
  },
} satisfies ChartConfig;

export function NetworkStats({ dataRate, dataHistory, streaming }: NetworkStatsProps) {
  return (
    <Card>
      {/* <CardHeader>
        <CardTitle>Network Stats</CardTitle>
        <CardDescription>Real-time transfer rate monitoring</CardDescription>
      </CardHeader> */}
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Transfer Rate</Label>
            <span className="text-2xl font-mono font-bold">
              {dataRate} <span className="text-sm text-muted-foreground">KB/s</span>
            </span>
          </div>
          {dataHistory.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <AreaChart data={dataHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(-5)}
                  fontSize={12}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="linear"
                  dataKey="rate"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#colorRate)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[150px] w-full flex items-center justify-center border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {streaming ? "Collecting data..." : "Start streaming to see transfer rate"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

