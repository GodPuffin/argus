import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number;
  className?: string;
}

export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border border-border bg-background px-4 py-3",
        className,
      )}
    >
      <span className="text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
