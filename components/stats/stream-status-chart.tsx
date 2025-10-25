"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie } from "recharts"

interface StreamStatusChartProps {
  data: {
    active: number
    idle: number
    disabled: number
  }
}

const chartConfig = {
  active: {
    label: "Active",
    color: "hsl(142, 70%, 45%)", // Green for active
  },
  idle: {
    label: "Idle",
    color: "hsl(25, 80%, 60%)", // Orange
  },
  disabled: {
    label: "Disabled",
    color: "hsl(0, 70%, 50%)", // Red for disabled
  },
}

export function StreamStatusChart({ data }: StreamStatusChartProps) {
  const chartData = [
    { name: "Active", value: data.active, fill: chartConfig.active.color },
    { name: "Idle", value: data.idle, fill: chartConfig.idle.color },
    { name: "Disabled", value: data.disabled, fill: chartConfig.disabled.color },
  ].filter(item => item.value > 0)

  const total = data.active + data.idle + data.disabled

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream Status</CardTitle>
        <CardDescription>
          {total > 0 ? `Total ${total} streams` : "No streams configured"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {total > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
            <PieChart>
              <ChartTooltip 
                cursor={false}
                content={<ChartTooltipContent hideLabel />} 
              />
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
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
                paddingAngle={2}
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No stream data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

