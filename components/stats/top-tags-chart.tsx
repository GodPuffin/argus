"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { ChartBackground } from "./chart-background"
import { getTagColor } from "@/lib/chart-colors"

interface TopTagsChartProps {
  data: Array<{ tag: string; count: number }>
}

export function TopTagsChart({ data }: TopTagsChartProps) {
  const chartData = data.slice(0, 10).map(item => ({
    tag: item.tag,
    count: item.count,
    fill: getTagColor(item.tag)
  }))
  
  // Build chart config dynamically
  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.tag] = {
      label: item.tag,
      color: item.fill
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Top AI Analysis Tags</CardTitle>
        <CardDescription>
          Most common tags from AI analysis results
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ left: 10, right: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="tag" 
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
                  <Cell key={entry.tag} fill={entry.fill} />
                ))}
              </Bar>
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No tag data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

