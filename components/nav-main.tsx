"use client"

import { type Icon } from "@tabler/icons-react"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title?: string
    items: {
      title: string
      url: string
      icon?: Icon
    }[]
  }[]
}) {
  const pathname = usePathname()
  
  return (
    <>
      {items.map((section) => (
        <SidebarGroup key={section.title || "main"}>
          {section.title && (
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
          )}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
