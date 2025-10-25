"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Legend } from "recharts"
import { Camera } from "lucide-react"
import { ChartBackground } from "./chart-background"

interface CameraActivityChartProps {
  data: Array<{ camera_name: string; event_count: number; camera_id: string }>
}

const COLORS = [
  "hsl(0, 85%, 65%)",   // Bright red - most active
  "hsl(10, 80%, 60%)",  // Red-orange
  "hsl(20, 75%, 58%)",  // Orange-red
  "hsl(30, 70%, 55%)",  // Deep orange
  "hsl(0, 70%, 45%)",   // Dark red
  "hsl(355, 75%, 50%)", // Crimson
  "hsl(15, 70%, 52%)",  // Burnt sienna
  "hsl(5, 65%, 48%)",   // Ruby
]

export function CameraActivityChart({ data }: CameraActivityChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.camera_name || `Camera ${index + 1}`,
    value: item.event_count,
    fill: COLORS[index % COLORS.length],
  }))

  const total = data.reduce((sum, item) => sum + item.event_count, 0)
  const topCamera = data.length > 0 ? data[0] : null

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Camera Activity Distribution
        </CardTitle>
        <CardDescription>
          {total > 0 
            ? `${total.toLocaleString()} total events across ${data.length} camera${data.length !== 1 ? 's' : ''}`
            : "No camera activity yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartBackground>
          {total > 0 ? (
            <div className="flex flex-col">
              <ChartContainer config={{}} className="mx-auto aspect-square max-h-[280px] w-full">
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
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
              {topCamera && (
                <div className="mt-2 text-center text-sm text-muted-foreground px-4 pb-4">
                  <span className="font-medium text-foreground">{topCamera.camera_name}</span> leads
                  with {topCamera.event_count.toLocaleString()} events
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No camera activity data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

