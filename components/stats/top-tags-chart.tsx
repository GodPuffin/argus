"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface TopTagsChartProps {
  data: Array<{ tag: string; count: number }>
}

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(0, 80%, 60%)",
  },
}

export function TopTagsChart({ data }: TopTagsChartProps) {
  const chartData = data.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top AI Analysis Tags</CardTitle>
        <CardDescription>
          Most common tags from AI analysis results
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
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
                dataKey="tag" 
                type="category" 
                width={90} 
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
                radius={[0, 4, 4, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No tag data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

