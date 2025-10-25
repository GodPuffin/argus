"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface DetectionsByHourChartProps {
  data: Array<{ timestamp: number; count: number }>
}

const chartConfig = {
  count: {
    label: "Detections",
    color: "hsl(10, 85%, 62%)",
  },
}

export function DetectionsByHourChart({ data }: DetectionsByHourChartProps) {
  // Group detections by hour
  const hourlyData = new Map<number, number>()
  
  for (const item of data) {
    const date = new Date(item.timestamp * 1000)
    const hour = date.getHours()
    hourlyData.set(hour, (hourlyData.get(hour) || 0) + item.count)
  }
  
  const chartData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: hourlyData.get(i) || 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detections by Hour</CardTitle>
        <CardDescription>
          Hourly detection patterns over time
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip 
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent />} 
              />
              <Bar 
                dataKey="count" 
                fill={chartConfig.count.color} 
                radius={[4, 4, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No hourly data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

