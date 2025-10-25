"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedTabsProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

export function AnimatedTabs({ tabs, activeTab, onTabChange, className }: AnimatedTabsProps) {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null)

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          onMouseEnter={() => setHoveredTab(tab)}
          onMouseLeave={() => setHoveredTab(null)}
          className={cn(
            "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            activeTab === tab ? "text-foreground" : "hover:text-foreground/80"
          )}
        >
          {/* Hover effect */}
          {hoveredTab === tab && activeTab !== tab && (
            <motion.div
              layoutId="hover"
              className="absolute inset-0 rounded-md bg-muted-foreground/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
          
          {/* Active tab background */}
          {activeTab === tab && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-md bg-background shadow-sm"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />
          )}
          
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  )
}

