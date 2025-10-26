"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AsciiEye } from "@/components/ascii-eye";
import Dither from "@/components/dither";
import TextType from "@/components/text-type";
import { Button } from "@/components/ui/button";

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

  return (
    <>
      {/* Loading Screen */}
      {isLoading && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-800 ${
            fadeOut ? "opacity-0" : "opacity-100"
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
        <div className="z-10 w-1/2 flex items-center justify-center relative pointer-events-none px-8">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8">
              ARGUS
            </h1>
            <Button
              variant="secondary"
              size="lg"
              className="pointer-events-auto"
            >
              <Link href="/watch">Go to Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Right side - ASCII Eye */}
        <div className="z-10 w-1/2 h-full flex items-center justify-center relative pointer-events-none">
          <div className="w-full h-full flex items-center justify-center">
            <AsciiEye />
          </div>
        </div>
      </main>
    </>
  );
}
