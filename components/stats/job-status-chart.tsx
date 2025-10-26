"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"
import { ChartBackground } from "./chart-background"
import { JOB_STATUS_COLORS } from "@/lib/chart-colors"

interface JobStatusChartProps {
  data: {
    queued: number
    processing: number
    succeeded: number
    failed: number
    dead: number
  }
}

const chartConfig = {
  queued: {
    label: "Queued",
    color: JOB_STATUS_COLORS.queued,
  },
  processing: {
    label: "Processing",
    color: JOB_STATUS_COLORS.processing,
  },
  succeeded: {
    label: "Succeeded",
    color: JOB_STATUS_COLORS.succeeded,
  },
  failed: {
    label: "Failed",
    color: JOB_STATUS_COLORS.failed,
  },
  dead: {
    label: "Dead",
    color: JOB_STATUS_COLORS.dead,
  },
}

export function JobStatusChart({ data }: JobStatusChartProps) {
  const chartData = [
    { name: "Queued", value: data.queued, fill: chartConfig.queued.color },
    { name: "Processing", value: data.processing, fill: chartConfig.processing.color },
    { name: "Succeeded", value: data.succeeded, fill: chartConfig.succeeded.color },
    { name: "Failed", value: data.failed, fill: chartConfig.failed.color },
    { name: "Dead", value: data.dead, fill: chartConfig.dead.color },
  ].filter(item => item.value > 0)

  const total = data.queued + data.processing + data.succeeded + data.failed + data.dead

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>AI Job Status Distribution</CardTitle>
        <CardDescription>
          {total > 0 ? `Total ${total.toLocaleString()} jobs` : "No jobs yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
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
              />
            </PieChart>
          </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

