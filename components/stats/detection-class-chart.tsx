"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Legend } from "recharts"

interface DetectionClassChartProps {
  data: Array<{ class: string; count: number }>
}

const COLORS = [
  "hsl(0, 85%, 65%)",   // Bright red
  "hsl(10, 85%, 60%)",  // Red-orange
  "hsl(20, 80%, 58%)",  // Orange-red
  "hsl(30, 75%, 55%)",  // Deep orange
  "hsl(0, 70%, 45%)",   // Dark red
  "hsl(355, 75%, 50%)", // Crimson
  "hsl(15, 70%, 52%)",  // Burnt sienna
]

export function DetectionClassChart({ data }: DetectionClassChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.class,
    value: item.count,
    fill: COLORS[index % COLORS.length],
  }))

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Object Detection Classes</CardTitle>
        <CardDescription>
          {total > 0 ? `Total ${total.toLocaleString()} detections` : "No detections yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
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
      </CardContent>
    </Card>
  )
}

