"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { ChartBackground } from "./chart-background"

interface EventTypeChartProps {
  data: Array<{ type: string; count: number }>
}

const EVENT_TYPE_COLORS = [
  "hsl(0, 80%, 60%)",
  "hsl(30, 75%, 55%)",
  "hsl(142, 70%, 45%)",
  "hsl(220, 70%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(160, 60%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(330, 70%, 55%)",
]

export function EventTypeChart({ data }: EventTypeChartProps) {
  const chartData = data.slice(0, 8).map((item, index) => ({
    type: item.type,
    count: item.count,
    fill: EVENT_TYPE_COLORS[index % EVENT_TYPE_COLORS.length]
  }))
  
  // Build chart config dynamically
  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.type] = {
      label: item.type,
      color: item.fill
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Event Types</CardTitle>
        <CardDescription>
          {total > 0 ? `Distribution of ${total.toLocaleString()} events by type` : "No events yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ left: 10, right: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="type" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent hideLabel />} 
                />
                <Bar 
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.type} fill={entry.fill} />
                  ))}
                </Bar>
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No event type data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

