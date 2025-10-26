"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
  content,
  contentClassName,
  onActiveCardChange,
  scrollContainerRef,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
  onActiveCardChange?: (index: number) => void;
  scrollContainerRef?: React.RefObject<any>;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = scrollContainerRef || useRef<any>(null);
  const { scrollYProgress } = useScroll({
    // uncomment line 22 and comment line 23 if you DONT want the overflow container and want to have it change on the entire page scroll
    // target: ref
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Calculate which card should be active based on scroll progress
    // Divide scroll progress into equal segments for each card
    const newActiveCard = Math.min(
      cardLength - 1,
      Math.floor(latest * cardLength)
    );
    
    if (newActiveCard !== activeCard) {
      setActiveCard(newActiveCard);
      if (onActiveCardChange) {
        onActiveCardChange(newActiveCard);
      }
    }
  });


  return (
    <motion.div
      className="relative flex h-[60rem] justify-center space-x-40 overflow-y-auto rounded-md p-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      ref={ref}
    >
      <div className="div relative flex items-start px-4">
        <div className="max-w-2xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="min-h-[800px] flex items-center">
              <div className="bg-primary-foreground/70 p-6 rounded-md border border-primary/10">
                <motion.h2
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: activeCard === index ? 1 : 0.3,
                  }}
                  className="text-2xl font-bold text-slate-100"
                >
                  {item.title}
                </motion.h2>
                <motion.p
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: activeCard === index ? 1 : 0.3,
                  }}
                  className="text-kg mt-6 max-w-sm text-slate-300"
                >
                  {item.description}
                </motion.p>
              </div>
            </div>
          ))}
          <div className="h-[200px]" />
        </div>
      </div>
      <div
        className={cn(
          "sticky top-10 hidden overflow-hidden rounded-md bg-transparent lg:block w-[1200px]",
          contentClassName,
        )}
      >
        {content[activeCard].content ?? null}
      </div>
    </motion.div>
  );
};
