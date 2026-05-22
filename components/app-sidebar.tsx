"use client";

import {
  IconBug,
  IconChartBar,
  IconDatabase,
  IconEye,
  IconFileText,
  IconList,
  IconMessageChatbot,
  IconPlayerPlay,
  IconSearch,
  IconVideo,
} from "@tabler/icons-react";
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

const data = {
  navMain: [
    {
      title: "Stream",
      items: [{ title: "Create Stream", url: "/stream", icon: IconVideo }],
    },
    {
      title: "Dashboard",
      items: [
        { title: "Watch", url: "/watch", icon: IconPlayerPlay },
        { title: "Stats", url: "/stats", icon: IconChartBar },
        { title: "Search", url: "/search", icon: IconSearch },
        { title: "AI Chat", url: "/ai-chat", icon: IconMessageChatbot },
        { title: "Reports", url: "/reports", icon: IconFileText },
      ],
    },
    {
      title: "Admin",
      items: [
        { title: "Jobs", url: "/jobs", icon: IconList },
        { title: "Database", url: "/database", icon: IconDatabase },
        { title: "Debug", url: "/debug", icon: IconBug },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 pt-5 pb-4">
        <a href="/" aria-label="Homepage" className="flex items-center gap-2">
          <IconEye className="size-4 text-muted-foreground" />
          <span className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-widest">
            argus
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent className="font-[family-name:var(--font-inter)]">
        <NavMain items={data.navMain} labelClassName="hidden" />
        <div className="mt-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
