"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { BrowserComponent } from "@/components/browser-component";

export type FeatureItem = {
  title: string;
  description: string;
  content: React.ReactNode;
};

const aiModels = [
  { code: "OBJDET", name: "Roboflow 3.0 Object Detection" },
  { code: "AGENT", name: "Letta Stateful Agent" },
  { code: "SEARCH", name: "Elasticsearch Agent" },
  { code: "LLM-A", name: "Groq Kimi K2 Instruct" },
  { code: "LLM-B", name: "Gemini 2.5 Pro" },
  { code: "LLM-C", name: "Claude 4.5 Haiku" },
  { code: "LLM-D", name: "Claude 4.5 Sonnet" },
];

function MetaStrip({
  left,
  middle,
  right,
}: {
  left: string;
  middle: string;
  right: string;
}) {
  return (
    <div className="flex items-center justify-between text-[11px] tracking-[0.22em] uppercase text-muted-foreground border-b border-border pb-4">
      <span>{left}</span>
      <span className="hidden sm:inline font-mono">{middle}</span>
      <span>{right}</span>
    </div>
  );
}

export function StyleManifest({ features }: { features: FeatureItem[] }) {
  return (
    <>
      {/* Models */}
      <section
        id="models"
        className="w-full bg-background text-foreground scroll-mt-24"
      >
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-20 lg:py-28">
          <MetaStrip
            left="Apparatus / Stack"
            middle="// Built on"
            right={`${aiModels.length.toString().padStart(2, "0")} components`}
          />

          <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-5">
              <div className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground mb-4">
                Specimen / Pipeline
              </div>
              <h2 className="font-bold text-[40px] sm:text-[56px] lg:text-[64px] leading-[0.95] tracking-tight max-w-[14ch]">
                Technology,
                <br />
                catalogued.
              </h2>
              <p className="mt-8 text-sm sm:text-base text-muted-foreground max-w-[44ch] leading-relaxed">
                Argus is built on a real-time streaming pipeline — Mux ingest,
                FFmpeg transmuxing, Roboflow detection at the edge, Gemini
                summaries, indexed in Elasticsearch and served through Supabase
                Realtime.
              </p>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-[44ch] leading-relaxed">
                Each component below is a working part of that loop — no
                vapourware, no stand-ins.
              </p>
            </div>

            <ol className="lg:col-span-7 lg:pl-8 lg:border-l border-border">
              {aiModels.map((m, i) => (
                <li
                  key={m.code}
                  className="grid grid-cols-[3rem_5rem_1fr] items-baseline gap-4 py-4 border-b border-border"
                >
                  <span className="font-mono text-xs tracking-widest text-muted-foreground">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
                    {m.code}
                  </span>
                  <span className="font-bold text-xl sm:text-2xl lg:text-3xl tracking-tight leading-tight">
                    {m.name}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSticky features={features} />

      <section className="w-full bg-background text-foreground border-t border-border">
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-12 lg:py-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground">
            End of catalogue
          </div>
          <Link
            href="/watch"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Open Argus
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Footer / Colophon */}
      <footer className="w-full bg-background text-foreground border-t border-border">
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
          <MetaStrip
            left="Colophon / Argus"
            middle="// Built by"
            right="02 humans"
          />

          <div className="mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-5">
              <div className="font-bold text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-none">
                ARGUS
              </div>
              <p className="mt-6 text-sm text-muted-foreground max-w-[36ch] leading-relaxed">
                Computer vision, analytics, and an AI assistant — watching your
                streams so you don&apos;t have to.
              </p>
            </div>

            <div className="lg:col-span-7 lg:pl-8 lg:border-l border-border grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                {
                  n: "01",
                  name: "Carson Spriggs-Audet",
                  links: [
                    { label: "LinkedIn", href: "https://www.linkedin.com/in/carsonspriggs" },
                    { label: "GitHub", href: "https://github.com/carsonSgit" },
                  ],
                },
                {
                  n: "02",
                  name: "Marcus Lee",
                  links: [
                    { label: "LinkedIn", href: "https://www.linkedin.com/in/marcus-m-lee/" },
                    { label: "GitHub", href: "https://github.com/godpuffin" },
                  ],
                },
              ].map((p) => (
                <div
                  key={p.n}
                  className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-border pb-6"
                >
                  <span className="font-mono text-xs tracking-widest text-muted-foreground">
                    {p.n}
                  </span>
                  <div>
                    <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-2">
                      Built by
                    </div>
                    <div className="font-bold text-2xl tracking-tight leading-none">
                      {p.name}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs font-mono tracking-widest uppercase">
                      {p.links.map((l) => (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-border flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} Argus</span>
            <span>v1.0 · build live</span>
          </div>
        </div>
      </footer>
    </>
  );
}

// Re-export BrowserComponent so callers using shared content keep working
export { BrowserComponent };

function FeaturesSticky({ features }: { features: FeatureItem[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const total = features.length;

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(total - 1, Math.max(0, Math.floor(v * total)));
    setActive(i);
  });

  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const fmt = (i: number) => (i + 5).toString().padStart(2, "0");

  return (
    <section
      id="features"
      ref={wrapperRef}
      className="relative w-full bg-background text-foreground border-t border-border scroll-mt-0"
      style={{ height: `${total * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="max-w-[1500px] h-full mx-auto px-6 sm:px-10 lg:px-12 pt-24 pb-8 flex flex-col">
          <MetaStrip
            left="Catalogue / Features"
            middle="// What it does"
            right={`${total.toString().padStart(2, "0")} entries`}
          />

          <div className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 flex-1 min-h-0 items-center">
            {/* Left: rail + active entry */}
            <div className="lg:col-span-5 flex gap-6 lg:gap-8 h-full items-center">
              <ol className="hidden lg:flex flex-col gap-4 pt-1 shrink-0">
                {features.map((_, i) => (
                  <li
                    key={i}
                    className={`font-mono text-xs tracking-widest transition-colors ${
                      i === active
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {fmt(i)}
                  </li>
                ))}
              </ol>

              <div className="relative flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <div className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground mb-3">
                      Fig. {fmt(active)}
                    </div>
                    <h3 className="font-bold text-3xl sm:text-4xl lg:text-5xl leading-[0.95] tracking-tight">
                      {features[active].title}
                    </h3>
                    <p className="mt-5 text-sm sm:text-base text-muted-foreground max-w-[42ch] leading-relaxed">
                      {features[active].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right: stacked screenshots, only active visible */}
            <div className="lg:col-span-7 lg:pl-8 lg:border-l border-border h-full flex flex-col justify-center">
              <div className="border border-border p-3 sm:p-4">
                <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-3 flex items-center justify-between">
                  <span>plate · {fmt(active)}</span>
                  <span>
                    live · {(active + 1).toString().padStart(2, "0")}/
                    {total.toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="relative w-full" style={{ aspectRatio: "16 / 10" }}>
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{ opacity: i === active ? 1 : 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      style={{ pointerEvents: i === active ? "auto" : "none" }}
                      className="absolute inset-0"
                    >
                      <div className="w-full h-full [&>div]:h-full [&_img]:!h-full [&_img]:!object-contain">
                        {f.content}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom progress rail */}
          <div className="mt-6 lg:mt-8 pt-4 border-t border-border flex items-center gap-4 text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-mono">
            <span className="text-foreground">
              {(active + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}
            </span>
            <div className="flex-1 h-px bg-border relative overflow-hidden">
              <motion.div
                className="absolute inset-y-[-1px] left-0 bg-foreground"
                style={{ width: progressWidth }}
              />
            </div>
            <span className="hidden sm:inline">scroll</span>
          </div>
        </div>
      </div>
    </section>
  );
}
