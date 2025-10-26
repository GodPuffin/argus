"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartBackground } from "./chart-background"
import { getSeverityChartColor } from "@/lib/severity-styles"

interface CameraEventHeatmapProps {
  data: Array<{
    camera_name: string
    camera_id: string
    high: number
    medium: number
    minor: number
    total: number
  }>
}

const chartConfig = {
  high: {
    label: "High",
    color: getSeverityChartColor('High'),
  },
  medium: {
    label: "Medium",
    color: getSeverityChartColor('Medium'),
  },
  minor: {
    label: "Minor",
    color: getSeverityChartColor('Minor'),
  },
}

export function CameraEventHeatmap({ data }: CameraEventHeatmapProps) {
  const chartData = data.slice(0, 8).map(item => ({
    camera: item.camera_name,
    high: item.high,
    medium: item.medium,
    minor: item.minor,
  }))

  const totalEvents = data.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Camera Event Patterns</CardTitle>
        <CardDescription>
          {totalEvents > 0 ? `Event severity by camera (${totalEvents.toLocaleString()} total)` : "No camera events yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ left: 0, right: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="camera"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar 
                  dataKey="high" 
                  stackId="a" 
                  fill={chartConfig.high.color}
                  radius={[0, 0, 0, 0]}
                  animationDuration={800}
                />
                <Bar 
                  dataKey="medium" 
                  stackId="a" 
                  fill={chartConfig.medium.color}
                  radius={[0, 0, 0, 0]}
                  animationDuration={800}
                />
                <Bar 
                  dataKey="minor" 
                  stackId="a" 
                  fill={chartConfig.minor.color}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No camera event data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

