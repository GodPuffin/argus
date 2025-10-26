'use client'

import Link from "next/link";
import Image from "next/image";
import { AsciiEye } from "@/components/ascii-eye";
import { useState, useEffect } from 'react';
import TextType from "@/components/text-type"
import { LuxeButton } from "@/components/ui/luxe-button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import Dither from "@/components/dither";
import { BrowserComponent } from "@/components/browser-component";
import { FeaturesAlternating } from "@/components/features-alternating";
import { ModelsSection } from "@/components/models-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      // Wait for typing animation to complete
      // "WELCOME TO ARGUS" = ~17 chars * 50ms = 850ms + 2000ms pause = ~2850ms
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Start fade out animation
      setFadeOut(true);
      
      // Remove loading screen after fade completes
      await new Promise(resolve => setTimeout(resolve, 800));
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
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <TextType
            text="WELCOME TO ARGUS"
            className="text-type text-6xl md:text-8xl font-bold text-white tracking-wider"
            initialDelay={0}
            pauseDuration={1000}
            deletingSpeed={50}
            loop={false}
            typingSpeed={120}
            showCursor={false}
          />
        </div>
      )}

      <div className="fixed inset-0 z-0">
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

      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-center p-4 ">
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

      <main id="overview" className="w-full min-h-screen flex items-center justify-between overflow-hidden relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-mt-24">

        <div className="z-10 ml-0 w-1/3 flex items-start justify-center relative pointer-events-none ">
          <div className="text-left">
            <h1 className="text-7xl mt-0 font-bold mb-4 pb-4">ARGUS</h1>
            <LuxeButton variant="animated-border" className="pointer-events-auto px-4 py-2 text-base">
              <Link href="/watch">Open Argus</Link>
            </LuxeButton>
          </div>
        </div>

        <div className="z-10 mt-10 w-1/2 h-full flex items-center justify-center relative pointer-events-none">
          <div className="w-full h-full flex items-center justify-center ">
            <AsciiEye />
          </div>
        </div>
      </main>

      <section id="models" className="w-full py-20 relative z-10 scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-6 text-foreground">Technology for the Future  </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">Argus is built on the latest and greatest technologies to deliver the best possible experience for you and your team.</p>
          <ModelsSection />
        </div>
      </section>

      <section id="features" className="w-full py-20 relative z-10 scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-foreground">Features</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Discover the powerful capabilities that make Argus the ultimate surveillance and monitoring solution.
          </p>
          <FeaturesAlternating features={featuresContent} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}