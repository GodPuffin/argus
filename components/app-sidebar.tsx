"use client"

import * as React from "react"
import {
  IconVideo,
  IconPlayerPlay,
  IconEye,
  IconChartBar,
  IconSearch,
  IconMessageChatbot,
  IconDatabase,
  IconList,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { UserNav } from "@/components/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const data = {
  navMain: [
    {
      title: "Stream",
      items: [
        {
          title: "Create Stream",
          url: "/stream",
          icon: IconVideo,
        },
      ],
    },
    {
      title: "Dashboard",
      items: [
        {
          title: "Watch",
          url: "/watch",
          icon: IconPlayerPlay,
        },
        {
          title: "Stats",
          url: "/stats",
          icon: IconChartBar,
        },
        {
          title: "Search",
          url: "/search",
          icon: IconSearch,
        },
        {
          title: "AI Chat",
          url: "/ai-chat",
          icon: IconMessageChatbot,
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          title: "Jobs",
          url: "/jobs",
          icon: IconList,
        },
        {
          title: "Database",
          url: "/database",
          icon: IconDatabase,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconEye className="size-5" />
                <span className="text-base font-semibold">Argus</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
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
  )
}
