"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AsciiEye } from "@/components/ascii-eye";
import Dither from '@/components/dither'
import { FeaturesAlternating } from "@/components/features-alternating";
import { NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { SiteFooter } from "@/components/site-footer";
import { BrowserComponent } from "@/components/browser-component";
import DecryptedText from "@/components/fancy/text/decrypted-text";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { LuxeButton } from "@/components/ui/luxe-button";
import { ModelsSection } from "@/components/models-section";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

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

      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background via-muted/30 to-background">
        <Dither
          waveColor={[0.15, 0.03, 0.03]}
          disableAnimation={false}
          enableMouseInteraction={false}
          mouseRadius={1}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={1}
          waveSpeed={0.05}
        />
      </div>

      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-center p-2 sm:p-4">
        <NavigationMenu>
          <NavigationMenuList className="flex-wrap justify-center gap-1 sm:gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink href="#overview" className="text-sm sm:text-base">Overview</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#models" className="text-sm sm:text-base">Models</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#features" className="text-sm sm:text-base">Features</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/watch" className="text-sm sm:text-base">Dashboard</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <main id="overview" className="w-full min-h-screen flex items-center justify-center lg:justify-between overflow-hidden relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-mt-24">

        {/* Desktop Layout */}
        <div className="hidden lg:flex z-10 ml-0 w-1/3 items-start justify-center relative pointer-events-none">
          <div className="text-left">
            <h1 className="text-7xl mt-0 font-bold mb-4 pb-4">ARGUS</h1>
            <LuxeButton variant="animated-border" className="pointer-events-auto px-4 py-2 text-base">
              <Link href="/watch">Open Argus</Link>
            </LuxeButton>
          </div>
        </div>

        <div className="hidden lg:flex z-10 mt-10 w-1/2 h-full items-center justify-center relative pointer-events-none">
          <div className="w-full h-full flex items-center justify-center">
            <AsciiEye />
          </div>
        </div>

        {/* Mobile Layout - Centered with Overlay */}
        <div className="lg:hidden relative w-full h-screen flex items-center justify-center px-4">
          {/* ASCII Eye Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-90 sm:scale-100">
            <AsciiEye />
          </div>
          
          {/* Overlayed Text Content */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-2xl">ARGUS</h1>
            <LuxeButton variant="animated-border" className="pointer-events-auto px-6 py-3 text-base">
              <Link href="/watch">Open Argus</Link>
            </LuxeButton>
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
