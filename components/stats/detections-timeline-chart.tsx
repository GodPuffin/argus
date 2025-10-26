"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartBackground } from "./chart-background"
import { DETECTIONS_TIMELINE_COLORS } from "@/lib/chart-colors"

interface DetectionsTimelineChartProps {
  data: Array<{ date: string; detections: number; frames: number }>
}

const chartConfig = {
  detections: {
    label: "Detections",
    color: DETECTIONS_TIMELINE_COLORS.detections,
  },
  frames: {
    label: "Frames",
    color: DETECTIONS_TIMELINE_COLORS.frames,
  },
}

export function DetectionsTimelineChart({ data }: DetectionsTimelineChartProps) {
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const totalDetections = data.reduce((sum, item) => sum + item.detections, 0)
  const totalFrames = data.reduce((sum, item) => sum + item.frames, 0)
  const avgPerFrame = totalFrames > 0 ? (totalDetections / totalFrames).toFixed(2) : '0'

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Detections Timeline</CardTitle>
        <CardDescription>
          Daily detection activity and frame processing
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
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="detections"
                  stroke={chartConfig.detections.color}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="frames"
                  stroke={chartConfig.frames.color}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              </LineChart>
            </ChartContainer>
              <div className="mt-3 text-sm text-muted-foreground px-2 pb-2">
                Average {avgPerFrame} detections per frame
              </div>
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No detection timeline data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

