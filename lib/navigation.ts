import {
  type Icon,
  IconBug,
  IconChartBar,
  IconDatabase,
  IconFileText,
  IconList,
  IconMessageChatbot,
  IconPlayerPlay,
  IconSearch,
  IconVideo,
} from "@tabler/icons-react";
import { isDemoMode } from "@/lib/demo/flag";
import { reset as resetDemoSession } from "@/lib/demo/session-store";

export interface NavItem {
  title: string;
  url: string;
  icon: Icon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Single source of truth for primary app navigation (sidebar + command menu). */
export const navSections: NavSection[] = [
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
      // Debug tools are hidden in the public demo.
      ...(isDemoMode ? [] : [{ title: "Debug", url: "/debug", icon: IconBug }]),
    ],
  },
];

/** Resets demo session state and reloads to the base demo view. */
export function resetDemoAndReload() {
  resetDemoSession();
  // Full reload returns every hook to base fixtures + first-run onboarding.
  window.location.href = "/watch";
}
