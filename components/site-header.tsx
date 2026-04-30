import { DemoBadge } from "@/components/demo/demo-disabled-notice";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isDemoMode } from "@/lib/demo/flag";

export function SiteHeader({
  title = "Argus",
  children,
}: Readonly<{
  title?: string;
  children?: React.ReactNode;
}>) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <h1 className="font-[family-name:var(--font-inter)] text-sm font-medium text-muted-foreground">
            {title}
          </h1>
          {isDemoMode && <DemoBadge />}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
