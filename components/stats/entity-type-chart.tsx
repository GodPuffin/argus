"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LuxeCard as Card,
  LuxeCardContent as CardContent,
  LuxeCardDescription as CardDescription,
  LuxeCardHeader as CardHeader,
  LuxeCardTitle as CardTitle,
} from "@/components/ui/luxe-card";
import { ENTITY_TYPE_COLORS, getEntityTypeColor } from "@/lib/chart-colors";
import { ChartBackground } from "./chart-background";

interface EntityTypeChartProps {
  data: Array<{ type: string; count: number }>;
}

const chartConfig = {
  person: {
    label: "Person",
    color: ENTITY_TYPE_COLORS.person,
  },
  object: {
    label: "Object",
    color: ENTITY_TYPE_COLORS.object,
  },
  location: {
    label: "Location",
    color: ENTITY_TYPE_COLORS.location,
  },
  vehicle: {
    label: "Vehicle",
    color: ENTITY_TYPE_COLORS.vehicle,
  },
  animal: {
    label: "Animal",
    color: ENTITY_TYPE_COLORS.animal,
  },
  unknown: {
    label: "Unknown",
    color: ENTITY_TYPE_COLORS.unknown,
  },
};

export function EntityTypeChart({ data }: EntityTypeChartProps) {
  const chartData = data.map((item) => ({
    name: item.type,
    value: item.count,
    fill: getEntityTypeColor(item.type),
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card variant="revealed-pointer">
      <CardHeader>
        <CardTitle>Entity Type Distribution</CardTitle>
        <CardDescription>
          {total > 0
            ? `Total ${total.toLocaleString()} entities detected`
            : "No entities yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartBackground>
          {total > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px] w-full"
            >
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
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No entity data available
            </div>
          )}
        </ChartBackground>
      </CardContent>
    </Card>
  );
}
