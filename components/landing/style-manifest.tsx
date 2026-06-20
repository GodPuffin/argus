"use client";

import Image from "next/image";
import { CtaLink } from "@/components/cta-link";
import { PricingSection } from "@/components/landing/pricing-section";
import { Section, SectionInner } from "@/components/landing/section";
import { WorkflowPipeline } from "@/components/landing/workflow-pipeline";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

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

function ModelsSection() {
  return (
    <Section id="models" className="scroll-mt-24">
      <SectionInner>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-14">
          <div className="lg:col-span-7">
            <h2 className="font-semibold text-5xl sm:text-6xl lg:text-[64px] tracking-tight text-balance max-w-[14ch]">
              Technology, catalogued.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 lg:border-l border-border flex flex-col justify-end gap-4">
            <p className="text-base text-muted-foreground text-pretty max-w-[44ch]">
              Argus is built on a real-time streaming pipeline — Mux ingest,
              FFmpeg transmuxing, Roboflow detection at the edge, Gemini
              summaries, indexed in Elasticsearch and served through Supabase
              Realtime.
            </p>
            <p className="text-base text-muted-foreground text-pretty max-w-[44ch]">
              Each component is a working part of that loop — no vapourware, no
              stand-ins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border border border-border">
          {aiModels.map((m) => (
            <div key={m.code} className="bg-background p-6 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.code}
              </span>
              <span className="font-semibold text-base sm:text-lg tracking-tight">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </SectionInner>
    </Section>
  );
}

function CtaSection() {
  return (
    <Section>
      <SectionInner className="py-12 lg:py-16 flex justify-end">
        <CtaLink href="/watch" className="rounded-none px-6 py-3">
          Open Argus <span aria-hidden>→</span>
        </CtaLink>
      </SectionInner>
    </Section>
  );
}

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
    <SectionInner className="py-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 border border-border min-h-[520px]">
        <div
          className={cn("relative overflow-hidden", reverse && "lg:order-2")}
        >
          <Image
            src={bg}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 flex flex-col justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-[640px] self-center">
              {feature.content}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col justify-center p-10 lg:p-16",
            reverse && "lg:order-1",
          )}
        >
          <p className="text-lg text-muted-foreground max-w-[44ch] text-pretty">
            {feature.description}
          </p>
        </div>
      </div>
    </SectionInner>
  );
}

function FeaturesAlternating({
  features,
}: {
  readonly features: FeatureItem[];
}) {
  const backgrounds = [
    "/assets/bg1.webp",
    "/assets/bg2.webp",
    "/assets/bg3.webp",
    "/assets/bg4.webp",
    "/assets/bg5.webp",
  ];

  return (
    <div
      id="features"
      className="w-full bg-background py-16 lg:py-24 space-y-12 lg:space-y-16 border-t border-border"
    >
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

export function LandingSections({ features }: { features: FeatureItem[] }) {
  return (
    <>
      <WorkflowPipeline />
      <ModelsSection />
      <FeaturesAlternating features={features} />
      <CtaSection />
      <PricingSection />
      <SiteFooter />
    </>
  );
}
