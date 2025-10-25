import { cn } from "@/lib/utils"

interface ChartBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function ChartBackground({ children, className }: ChartBackgroundProps) {
  return (
    <div className={cn(
      "rounded-lg bg-background/20 border border-muted-foreground/10 p-4 pt-8 mb-0",
      className
    )}>
      {children}
    </div>
  )
}

