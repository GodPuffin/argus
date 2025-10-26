'use client'

import Link from "next/link";
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

      {/* Navigation Menu */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-center p-4 ">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#overview">Overview</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#features">Features</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#contact">Contact</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Main Content */}
      <main className="w-full min-h-screen flex items-center justify-between overflow-hidden relative">
        {/* Dither background */}
        <div className="absolute inset-0 z-0">
          <Dither
            waveColor={[0.18, 0.08, 0.08]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={1}
            colorNum={4}
            waveAmplitude={0.1}
            waveFrequency={1}
            waveSpeed={0.1}
          />
        </div>

        {/* Left side - Main content */}
        <div className="z-10 ml-0 w-1/3 flex items-start justify-center relative pointer-events-none ">
          <div className="text-left">
            <h1 className="text-7xl mt-0 font-bold mb-4 text-primary-invert pb-4">ARGUS</h1>
            <LuxeButton variant="animated-border" className="pointer-events-auto px-4 py-2 text-base">
              <Link href="/watch">Open Argus</Link>
            </LuxeButton>
          </div>
        </div>

        {/* Right side - ASCII Eye */}
        <div className="z-10 mt-10 w-1/2 h-full flex items-center justify-center relative pointer-events-none">
          <div className="w-full h-full flex items-center justify-center ">
            <AsciiEye />
          </div>
        </div>
      </main>
    </>
  );
}