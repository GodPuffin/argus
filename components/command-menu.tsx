"use client";

import { IconRefresh, IconRocket } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { isDemoMode } from "@/lib/demo/flag";
import { navSections, resetDemoAndReload } from "@/lib/navigation";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const handleResetDemo = () => {
    setOpen(false);
    resetDemoAndReload();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {navSections.map((section, idx) => (
          <React.Fragment key={section.title}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={section.title}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.url}
                    onSelect={() => handleSelect(item.url)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
        {isDemoMode && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Demo">
              <CommandItem
                onSelect={() => handleSelect("/onboarding")}
                className="cursor-pointer"
              >
                <IconRocket className="mr-2 h-4 w-4" />
                <span>Run setup copilot</span>
              </CommandItem>
              <CommandItem
                onSelect={handleResetDemo}
                className="cursor-pointer"
              >
                <IconRefresh className="mr-2 h-4 w-4" />
                <span>Reset demo</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
