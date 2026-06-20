"use client";

import Link from "next/link";
import { AsciiEye } from "@/components/ascii-eye";
import { FeatureShot } from "@/components/landing/feature-shot";
import {
  type FeatureItem,
  LandingSections,
} from "@/components/landing/style-manifest";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

const features: Array<{
  title: string;
  description: string;
  url: string;
  src: string;
  alt: string;
}> = [
  {
    title: "Live Dashboard",
    description:
      "Dashboard showcasing all current RTMP streams with automated video asset creation.",
    url: "argus.io/dashboard",
    src: "/assets/argusdash.webp",
    alt: "Argus Dashboard",
  },
  {
    title: "Entity & Event Detection",
    description: "Entity and event detection with AI-powered analysis.",
    url: "argus.io/watch/{asset_id}",
    src: "/assets/argusdetection.webp",
    alt: "Argus Detection",
  },
  {
    title: "Analytics & Statistics",
    description: "Comprehensive stats from all events and anomalies detected.",
    url: "argus.io/stats",
    src: "/assets/argusstats.webp",
    alt: "Argus Statistics",
  },
  {
    title: "Automated Reports",
    description:
      "Auto-generated editable rich incident reports based on detected events.",
    url: "argus.io/reports",
    src: "/assets/argusreports.webp",
    alt: "Argus Reports",
  },
  {
    title: "Elasticsearch Agent",
    description:
      "Search through all detected anomalies and events with powerful Elasticsearch Agent integration.",
    url: "argus.io/search",
    src: "/assets/argussearch.webp",
    alt: "Argus Search",
  },
  {
    title: "AI Assistant",
    description:
      "Search for specific event types, ask questions, generate reports, and more.",
    url: "argus.io/chat",
    src: "/assets/arguschat.webp",
    alt: "Argus Chat",
  },
];

const featuresContent: FeatureItem[] = features.map((feature, i) => ({
  title: feature.title,
  description: feature.description,
  content: (
    <FeatureShot
      url={feature.url}
      src={feature.src}
      alt={feature.alt}
      priority={i === 1}
    />
  ),
}));

export default function Home() {
  return (
    <>
      <div className="fixed top-4 right-4 z-20">
        <ModeToggle />
      </div>

      <main
        id="overview"
        className="w-full bg-background text-foreground scroll-mt-24"
      >
        <div className="min-h-dvh flex flex-col justify-center">
          <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 pt-24 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 lg:items-center">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-5">
                  <span className="inline-flex w-fit items-center gap-2 border border-border py-1.5 pr-3 pl-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="relative flex size-1.5 items-center justify-center">
                      <span
                        className="absolute inline-flex size-full rounded-full animate-ping motion-reduce:hidden"
                        style={{ backgroundColor: "var(--linear-success)" }}
                      />
                      <span
                        className="relative size-1.5 rounded-full"
                        style={{ backgroundColor: "var(--linear-success)" }}
                      />
                    </span>
                    Live · real-time surveillance intelligence
                  </span>
                  <h1 className="font-semibold text-5xl sm:text-6xl lg:text-7xl tracking-tight text-balance max-w-[14ch]">
                    The watcher, catalogued.
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground text-pretty max-w-[44ch]">
                  Computer vision, analytics, and an AI assistant — watching
                  your streams so you don&apos;t have to.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    className="h-auto px-6 py-3 text-white hover:bg-[var(--linear-primary-hover)] transition-colors"
                  >
                    <Link href="/onboarding">
                      Get Started <span aria-hidden>→</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto px-6 py-3 transition-colors"
                  >
                    <Link href="/watch">Skip to Dashboard</Link>
                  </Button>
                </div>
              </div>

              <div className="relative aspect-square w-full max-w-[560px] lg:ml-auto">
                <div className="absolute inset-0 border border-border" />

                {/* Targeting brackets */}
                <span
                  aria-hidden
                  className="absolute -top-px -left-px size-4 border-t-2 border-l-2 border-foreground/40"
                />
                <span
                  aria-hidden
                  className="absolute -top-px -right-px size-4 border-t-2 border-r-2 border-foreground/40"
                />
                <span
                  aria-hidden
                  className="absolute -bottom-px -left-px size-4 border-b-2 border-l-2 border-foreground/40"
                />
                <span
                  aria-hidden
                  className="absolute -bottom-px -right-px size-4 border-b-2 border-r-2 border-foreground/40"
                />

                {/* Viewfinder scanline */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-primary/50 animate-scanline motion-reduce:hidden" />
                </div>

                {/* REC + tracking labels */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  <span className="size-1.5 rounded-full bg-destructive animate-pulse motion-reduce:animate-none" />
                  Rec
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-3 right-3 text-[10px] uppercase tracking-widest text-muted-foreground tabular-nums"
                >
                  Trk · 48.42°N
                </div>

                <div className="absolute inset-3 [&_span]:!text-foreground flex items-center justify-center">
                  <AsciiEye />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingSections features={featuresContent} />
    </>
  );
}
