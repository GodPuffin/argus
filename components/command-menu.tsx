"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconVideo,
  IconPlayerPlay,
  IconEye,
  IconChartBar,
  IconSearch,
  IconMessageChatbot,
  IconDatabase,
  IconList,
  IconBug,
} from "@tabler/icons-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const navigationItems = [
  {
    group: "Stream",
    items: [
      {
        title: "Create Stream",
        url: "/stream",
        icon: IconVideo,
      },
    ],
  },
  {
    group: "Dashboard",
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
    group: "Admin",
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
      {
        title: "Debug",
        url: "/debug",
        icon: IconBug,
      },
    ],
  },
]

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {navigationItems.map((section, idx) => (
          <React.Fragment key={section.group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={section.group}>
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.url}
                    onSelect={() => handleSelect(item.url)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

