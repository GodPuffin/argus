"use client";

import Link from "next/link";
import Image from "next/image";
import { BrowserComponent } from "@/components/browser-component";
import { PricingSection } from "@/components/landing/pricing-section";

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

const contributors = [
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
];

export function StyleManifest({ features }: { features: FeatureItem[] }) {
  return (
    <>
      {/* Models */}
      <section id="models" className="w-full bg-background text-foreground scroll-mt-24 border-t border-border">
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-20 lg:py-28">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-14">
            <div className="lg:col-span-7">
              <h2 className="font-[family-name:var(--font-inter)] font-semibold text-5xl sm:text-6xl lg:text-[64px] tracking-tight text-balance max-w-[14ch]">
                Technology, catalogued.
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pl-8 lg:border-l border-border flex flex-col justify-end gap-4">
              <p className="font-[family-name:var(--font-inter)] text-base text-muted-foreground text-pretty max-w-[44ch]">
                Argus is built on a real-time streaming pipeline — Mux ingest, FFmpeg transmuxing, Roboflow detection at the edge, Gemini summaries, indexed in Elasticsearch and served through Supabase Realtime.
              </p>
              <p className="font-[family-name:var(--font-inter)] text-base text-muted-foreground text-pretty max-w-[44ch]">
                Each component is a working part of that loop — no vapourware, no stand-ins.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border border border-border">
            {aiModels.map((m) => (
              <div key={m.code} className="bg-background p-6 flex flex-col gap-2">
                <span className="font-[family-name:var(--font-inter)] text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.code}
                </span>
                <span className="font-[family-name:var(--font-inter)] font-semibold text-base sm:text-lg tracking-tight">
                  {m.name}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Features */}
      <FeaturesAlternating features={features} />

      {/* CTA */}
      <section className="w-full bg-background text-foreground border-t border-border">
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-12 lg:py-16 flex justify-end">
          <Link
            href="/watch"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity font-[family-name:var(--font-inter)]"
          >
            Open Argus <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <PricingSection />

      {/* Footer */}
      <footer className="w-full bg-background text-foreground border-t border-border">
        <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <div className="font-[family-name:var(--font-inter)] font-semibold text-5xl sm:text-6xl lg:text-7xl tracking-tight">
                ARGUS
              </div>
              <p className="mt-6 font-[family-name:var(--font-inter)] text-sm text-muted-foreground max-w-[36ch] text-pretty">
                Computer vision, analytics, and an AI assistant — watching your streams so you don&apos;t have to.
              </p>
            </div>

            <div className="lg:col-span-7 lg:pl-8 lg:border-l border-border">
              <div className="grid grid-cols-2 gap-px bg-border border border-border">
                {contributors.map((p) => (
                  <div key={p.n} className="bg-background p-6">
                    <div className="font-[family-name:var(--font-inter)] font-semibold text-xl tracking-tight">
                      {p.name}
                    </div>
                    <div className="mt-3 flex gap-4">
                      {p.links.map((l) => (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          className="font-[family-name:var(--font-inter)] text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-border flex items-center justify-between font-[family-name:var(--font-inter)] text-[10px] tracking-widest uppercase text-muted-foreground">
            <span>© {new Date().getFullYear()} Argus</span>
            <span>v1.0</span>
          </div>
        </div>
      </footer>
    </>
  );
}

export { BrowserComponent };

function FeatureBlock({
  feature,
  index,
  bg,
  reverse,
}: {
  readonly feature: FeatureItem;
  readonly index: number;
  readonly bg: string;
  readonly reverse: boolean;
}) {
  return (
    <article className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 border border-border min-h-[520px]">
        <div className={`relative overflow-hidden ${reverse ? "lg:order-2" : ""}`}>
          <Image
            src={bg}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 flex flex-col justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-[640px] self-center">{feature.content}</div>
          </div>
        </div>

        <div className={`flex flex-col justify-center p-10 lg:p-16 ${reverse ? "lg:order-1" : ""}`}>
          <p className="font-[family-name:var(--font-inter)] text-lg text-muted-foreground max-w-[44ch] text-pretty">
            {feature.description}
          </p>
        </div>
      </div>
    </article>
  );
}

function FeaturesAlternating({ features }: { readonly features: FeatureItem[] }) {
  const backgrounds = [
    "/assets/bg1.webp",
    "/assets/bg2.webp",
    "/assets/bg3.webp",
    "/assets/bg4.webp",
    "/assets/bg5.webp",
  ];

  return (
    <div id="features" className="w-full bg-background py-16 lg:py-24 space-y-12 lg:space-y-16 border-t border-border">
      {features.map((feature, i) => (
        <FeatureBlock
          key={feature.title}
          feature={feature}
          index={i}
          bg={backgrounds[i % backgrounds.length]}
          reverse={i % 2 === 1}
        />
      ))}
    </div>
  );
}
