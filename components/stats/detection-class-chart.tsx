"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Legend } from "recharts"
import { ChartBackground } from "./chart-background"
import { DETECTION_CLASS_COLORS } from "@/lib/chart-colors"

interface DetectionClassChartProps {
  data: Array<{ class: string; count: number }>
}

export function DetectionClassChart({ data }: DetectionClassChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.class,
    value: item.count,
    fill: DETECTION_CLASS_COLORS[index % DETECTION_CLASS_COLORS.length],
  }))

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Object Detection Classes</CardTitle>
        <CardDescription>
          {total > 0 ? `Total ${total.toLocaleString()} detections` : "No detections yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {total > 0 ? (
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-[300px] w-full">
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
              No detection data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

