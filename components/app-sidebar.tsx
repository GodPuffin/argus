"use client";

import { IconEye, IconRefresh } from "@tabler/icons-react";
import type * as React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { NavMain } from "@/components/nav-main";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { isDemoMode } from "@/lib/demo/flag";
import { navSections, resetDemoAndReload } from "@/lib/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <a href="/" aria-label="Homepage" className="flex items-center gap-2">
            <IconEye className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              argus
            </span>
          </a>
          {isDemoMode && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Demo
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navSections} labelClassName="hidden" />
        <div className="mt-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        {isDemoMode && (
          <button
            type="button"
            onClick={resetDemoAndReload}
            className="mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <IconRefresh className="size-4" />
            Reset demo
          </button>
        )}
        <Separator />
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
