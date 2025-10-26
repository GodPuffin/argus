"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { ChartBackground } from "./chart-background"
import { getColorblindSafeColor } from "@/lib/chart-colors"

interface CameraActivityChartProps {
  data: Array<{ camera_name: string; event_count: number; camera_id: string }>
}

export function CameraActivityChart({ data }: CameraActivityChartProps) {
  const chartData = data.slice(0, 10).map((item, index) => ({
    camera: item.camera_name,
    jobs: item.event_count,
    fill: getColorblindSafeColor(index)
  }))
  
  // Build chart config dynamically
  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.camera] = {
      label: item.camera,
      color: item.fill
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  const total = data.reduce((sum, item) => sum + item.event_count, 0)

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Camera Analysis Activity</CardTitle>
        <CardDescription>
          {total > 0 ? `AI jobs processed per camera (${total.toLocaleString()} total)` : "No camera activity yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  dataKey="camera" 
                  type="category" 
                  width={120} 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent hideLabel />} 
                />
                <Bar 
                  dataKey="jobs"
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.camera} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
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
