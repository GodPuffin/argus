"use client"

import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { PieChart, Pie } from "recharts"
import { ChartBackground } from "./chart-background"
import { getSeverityChartColor } from "@/lib/severity-styles"

interface EventSeverityChartProps {
  data: Array<{ severity: string; count: number }>
}

const chartConfig = {
  High: {
    label: "High",
    color: getSeverityChartColor('High'),
  },
  Medium: {
    label: "Medium",
    color: getSeverityChartColor('Medium'),
  },
  Minor: {
    label: "Minor",
    color: getSeverityChartColor('Minor'),
  },
}

export function EventSeverityChart({ data }: EventSeverityChartProps) {
  const chartData = data.map(item => ({
    name: item.severity,
    value: item.count,
    fill: chartConfig[item.severity as keyof typeof chartConfig]?.color || 'hsl(var(--muted))'
  }))

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Event Severity Distribution</CardTitle>
        <CardDescription>
          {total > 0 ? `Total ${total.toLocaleString()} events` : "No events yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {total > 0 ? (
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
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
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No event data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  )
}

