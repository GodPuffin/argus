"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AsciiEye } from "@/components/ascii-eye";
import { FeaturesAlternating } from "@/components/features-alternating";
import { NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { SiteFooter } from "@/components/site-footer";
import { BrowserComponent } from "@/components/browser-component";
import DecryptedText from "@/components/fancy/text/decrypted-text";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { ModelsSection } from "@/components/models-section";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      // Wait for typing animation to complete
      // "WELCOME TO ARGUS" = ~17 chars * 50ms = 850ms + 2000ms pause = ~2850ms
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // Start fade out animation
      setFadeOut(true);

      // Remove loading screen after fade completes
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsLoading(false);
    };

    loadContent();
  }, []);

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
      {/* Loading Screen */}
      {isLoading && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-800 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-6">
            <DecryptedText
              text="ARGUS"
              revealDurationMs={1400}
              scrambleSpeed={24}
              className="text-6xl md:text-8xl font-extrabold tracking-widest text-white"
            />
            <DecryptedText
              text="Computer Vision • Analytics • AI Assistant"
              revealDurationMs={1600}
              scrambleSpeed={28}
              className="text-white/70 text-base md:text-lg tracking-wide"
            />
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-20 items-center justify-center p-4">
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
              <NavigationMenuLink href="/watch">Dashboard</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-4 right-4 z-20">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link 
                href="#overview" 
                className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                onClick={() => setMobileMenuOpen(false)}
              >
                Overview
              </Link>
              <Link 
                href="#models" 
                className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                onClick={() => setMobileMenuOpen(false)}
              >
                Models
              </Link>
              <Link 
                href="#features" 
                className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/watch" 
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <main
        id="overview"
        className="w-full min-h-screen bg-background text-foreground relative scroll-mt-24"
      >
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 pt-28 pb-20">
          {/* Top meta */}
          <div className="flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-muted-foreground border-b border-border pb-4">
            <span>Manifest / Argus</span>
            <span className="hidden sm:inline font-mono">
              {"// What it does"}
            </span>
            <span>04 entries</span>
          </div>

          <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Left: numbered manifest */}
            <ol className="lg:col-span-5 space-y-3 lg:space-y-4">
              {[
                { n: "01", t: "See", d: "Live RTMP feeds, watched continuously." },
                { n: "02", t: "Detect", d: "Entities and events, in real time.", active: true },
                { n: "03", t: "Report", d: "Editable, rich incident reports — auto-drafted." },
                { n: "04", t: "Understand", d: "Search every anomaly. Ask anything." },
              ].map((row) => (
                <li
                  key={row.n}
                  className={`group grid grid-cols-[3rem_1fr] items-baseline gap-4 py-3 border-b border-border ${
                    row.active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span className="font-mono text-xs tracking-widest">
                    {row.n}
                  </span>
                  <div>
                    <div
                      className={`font-bold text-3xl sm:text-4xl lg:text-5xl leading-none tracking-tight ${
                        row.active ? "text-foreground" : "text-foreground/40"
                      }`}
                    >
                      {row.t}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {row.d}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* Right: specimen card */}
            <div className="lg:col-span-7 lg:pl-8 lg:border-l border-border">
              <div className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground mb-4">
                Specimen / Iris
              </div>
              <h1 className="font-bold text-[40px] sm:text-[56px] lg:text-[72px] leading-[0.95] tracking-tight max-w-[14ch]">
                The watcher,
                <br />
                catalogued.
              </h1>

              <div className="mt-10 relative aspect-square w-full max-w-[460px] mx-auto lg:mx-0">
                <div className="absolute inset-0 border border-border" />
                <div className="absolute inset-3 [&_span]:!text-foreground flex items-center justify-center">
                  <AsciiEye />
                </div>
              </div>
              <div className="mt-3 max-w-[460px] flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
                <span>fig. 01</span>
                <span>braille · ascii · live</span>
              </div>

              <div className="mt-10">
                <Link
                  href="/watch"
                  className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Open Argus
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="models" className="w-full py-12 lg:py-20 relative z-10 scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 lg:mb-6 text-foreground">Technology for the Future</h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 lg:mb-12 max-w-2xl mx-auto px-4">Argus is built on the latest and greatest technologies to deliver the best possible experience for you and your team.</p>
          <ModelsSection />
        </div>
      </section>

      <section id="features" className="w-full py-12 lg:py-20 relative z-10 scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 lg:mb-4 text-foreground">Features</h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 lg:mb-12 max-w-2xl mx-auto px-4">
            Discover the powerful capabilities that make Argus the ultimate surveillance and monitoring solution.
          </p>
          <FeaturesAlternating features={featuresContent} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
