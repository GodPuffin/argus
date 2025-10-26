"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { ChartBackground } from "./chart-background"
import { getEntityTypeColor } from "@/lib/chart-colors"

interface TopEntitiesChartProps {
  data: Array<{ entity: string; count: number; type?: string }>
}


export function TopEntitiesChart({ data }: TopEntitiesChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const topData = data.slice(0, 10).map(item => ({
    entity: item.entity,
    count: item.count,
    fill: item.type ? getEntityTypeColor(item.type) : "hsl(0, 0%, 50%)"
  }))
  
  // Build chart config dynamically
  const chartConfig = topData.reduce((acc, item) => {
    acc[item.entity] = {
      label: item.entity,
      color: item.fill
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Top Detected Entities</CardTitle>
        <CardDescription>
          {total > 0 ? `Most frequently detected entities (${total.toLocaleString()} total)` : "No entities yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {topData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={topData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  dataKey="entity" 
                  type="category" 
                  width={100} 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent hideLabel />} 
                />
                <Bar 
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                >
                  {topData.map((entry) => (
                    <Cell key={entry.entity} fill={entry.fill} />
                  ))}
                </Bar>
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No entity data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

