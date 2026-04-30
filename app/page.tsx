"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AsciiEye } from "@/components/ascii-eye";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { BrowserComponent } from "@/components/browser-component";
import { StyleManifest } from "@/components/landing/style-manifest";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const featuresContent = [
    {
      title: "Live Dashboard",
      description: "Dashboard showcasing all current RTMP streams with automated video asset creation.",
      content: (
        <div className="space-y-4">
          <BrowserComponent url="argus.io/dashboard" className="h-auto">
            <Image
              src="/assets/argusdash.webp"
              alt="Argus Dashboard"
              height={1080}
              width={1920}
              className="w-full h-auto object-contain"
            />
          </BrowserComponent>
        </div>
      ),
    },
    {
      title: "Entity & Event Detection",
      description: "Entity and event detection with AI-powered analysis.",
      content: (
        <div className="space-y-4">
          <BrowserComponent url="argus.io/watch/{asset_id}" className="h-auto">
            <Image
              src="/assets/argusdetection.webp"
              alt="Argus Detection"
              height={1080}
              width={1920}
              className="w-full h-auto object-contain"
              priority
              unoptimized
            />
          </BrowserComponent>
        </div>
      ),
    },
    {
      title: "Analytics & Statistics",
      description: "Comprehensive stats from all events and anomalies detected.",
      content: (
        <div className="space-y-4">
          <BrowserComponent url="argus.io/stats" className="h-auto">
            <Image
              src="/assets/argusstats.webp"
              alt="Argus Statistics"
              height={1080}
              width={1920}
              className="w-full h-auto object-contain"
            />
          </BrowserComponent>
        </div>
      ),
    },
    {
      title: "Automated Reports",
      description: "Auto-generated editable rich incident reports based on detected events.",
      content: (
        <div className="space-y-4">
          <BrowserComponent url="argus.io/reports" className="h-auto">
            <Image
              src="/assets/argusreports.webp"
              alt="Argus Reports"
              height={1080}
              width={1920}
              className="w-full h-auto object-contain"
            />
          </BrowserComponent>
        </div>
      ),
    },
    {
      title: "Elasticsearch Agent",
      description: "Search through all detected anomalies and events with powerful Elasticsearch Agent integration.",
      content: (
        <div className="space-y-4">
          <BrowserComponent url="argus.io/search" className="h-auto">
            <Image
              src="/assets/argussearch.webp"
              alt="Argus Search"
              height={1080}
              width={1920}
              className="w-full h-auto object-contain"
            />
          </BrowserComponent>
        </div>
      ),
    },
    {
      title: "AI Assistant",
      description: "Search for specific event types, ask questions, generate reports, and more.",
      content: (
        <div className="space-y-4">
          <BrowserComponent url="argus.io/chat" className="h-auto">
            <Image
              src="/assets/arguschat.webp"
              alt="Argus Chat"
              height={1080}
              width={1920}
              className="w-full h-auto object-contain"
            />
          </BrowserComponent>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-20 items-center justify-between p-4">
        <div className="w-[100px]" /> {/* Spacer */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#overview">Overview</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#models">Models</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#features">Features</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/watch">Dashboard</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="w-[100px] flex justify-end">
          <ModeToggle />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-4 right-4 z-20 flex items-center gap-2">
        <ModeToggle />
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="#overview" className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Overview</Link>
              <Link href="#models" className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Models</Link>
              <Link href="#features" className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link href="#pricing" className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/watch" className="text-lg font-medium hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Hero — Lateral (finalised) */}
      <main id="overview" className="w-full bg-background text-foreground scroll-mt-24">
        <div className="min-h-dvh flex flex-col justify-center">
          <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 pt-24 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 lg:items-center">

              <div className="flex flex-col gap-8">
                <h1 className="font-[family-name:var(--font-inter)] font-semibold text-5xl sm:text-6xl lg:text-7xl tracking-tight text-balance max-w-[14ch]">
                  The watcher, catalogued.
                </h1>
                <p className="font-[family-name:var(--font-inter)] text-lg text-muted-foreground text-pretty max-w-[44ch]">
                  Computer vision, analytics, and an AI assistant — watching your streams so you don&apos;t have to.
                </p>
                <div>
                  <Link
                    href="/watch"
                    className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity font-[family-name:var(--font-inter)]"
                  >
                    Open Argus <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>

              <div className="relative aspect-square w-full max-w-[560px] lg:ml-auto">
                <div className="absolute inset-0 border border-border" />
                <div className="absolute inset-3 [&_span]:!text-foreground flex items-center justify-center">
                  <AsciiEye />
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <StyleManifest features={featuresContent} />
    </>
  );
}
