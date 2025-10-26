"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LuxeCard, LuxeCardHeader, LuxeCardTitle, LuxeCardDescription } from "@/components/ui/luxe-card";

gsap.registerPlugin(ScrollTrigger);

interface FeaturesAlternatingProps {
  features: Array<{
    title: string;
    description: string;
    content: React.ReactNode;
  }>;
}

export function FeaturesAlternating({
  features,
}: FeaturesAlternatingProps) {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    sectionRefs.current.forEach((section, index) => {
      if (!section) return;

      const isEven = index % 2 === 0;
      const cardElement = section.querySelector('.feature-card');
      const contentElement = section.querySelector('.feature-content');

      // Animate card sliding in from its side
      if (cardElement) {
        gsap.fromTo(
          cardElement,
          {
            x: isEven ? -100 : 100,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "top 50%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Animate content sliding in from opposite side
      if (contentElement) {
        gsap.fromTo(
          contentElement,
          {
            x: isEven ? 100 : -100,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "top 50%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [features]);

  return (
    <div className="w-full max-w-[95%] lg:max-w-[80%] mx-auto space-y-12 lg:space-y-24">
      {features.map((feature, index) => {
        const isEven = index % 2 === 0;
        
        return (
          <div
            key={index}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start"
          >
            {isEven ? (
              <>
                {/* Left: Text Content */}
                <LuxeCard variant="revealed-pointer" className="feature-card">
                  <LuxeCardHeader>
                    <LuxeCardTitle className="text-xl lg:text-2xl">
                      {feature.title}
                    </LuxeCardTitle>
                    <LuxeCardDescription className="text-base lg:text-lg">
                      {feature.description}
                    </LuxeCardDescription>
                  </LuxeCardHeader>
                </LuxeCard>

                {/* Right: Browser Component */}
                <div className="w-full min-h-[300px] lg:min-h-[600px] feature-content">
                  {feature.content}
                </div>
              </>
            ) : (
              <>
                {/* Left: Browser Component */}
                <div className="w-full min-h-[300px] lg:min-h-[600px] feature-content lg:order-first">
                  {feature.content}
                </div>

                {/* Right: Text Content */}
                <LuxeCard variant="revealed-pointer" className="feature-card lg:order-last">
                  <LuxeCardHeader>
                    <LuxeCardTitle className="text-xl lg:text-2xl">
                      {feature.title}
                    </LuxeCardTitle>
                    <LuxeCardDescription className="text-base lg:text-lg">
                      {feature.description}
                    </LuxeCardDescription>
                  </LuxeCardHeader>
                </LuxeCard>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

