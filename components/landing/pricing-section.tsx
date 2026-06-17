"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import {
  ButtonBrailleBg,
  type BrailleVariant,
  MiniBrailleBg,
} from "@/components/landing/braille-bg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Self-Hosted",
    monthlyPrice: null as number | null,
    yearlyPrice: null as number | null,
    priceLabel: "Free",
    description:
      "For developers who want full control over their own infrastructure.",
    features: [
      "Bring Your Own Key (BYOK)",
      "1 camera stream",
      "Basic AI threat detection",
      "Community support",
      "Standard rate limits",
    ],
    buttonText: "Deploy for free",
    variant: "matrix" as BrailleVariant,
    popular: false,
  },
  {
    name: "Starter",
    monthlyPrice: 299,
    yearlyPrice: 239,
    priceLabel: null as string | null,
    description:
      "For small teams securing physical spaces with intelligent monitoring.",
    features: [
      "Up to 3 cameras",
      "AI threat detection (Gemini 2.5 Pro)",
      "Semantic event search",
      "AI chat assistant",
      "30-day event retention",
      "Basic analytics dashboard",
      "Email support",
    ],
    buttonText: "Get Started",
    variant: "wave" as BrailleVariant,
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 699,
    yearlyPrice: 559,
    priceLabel: null as string | null,
    description:
      "For security teams that need the full power of agentic AI surveillance.",
    features: [
      "Up to 15 cameras",
      "Full AI model suite (Claude + Gemini)",
      "Advanced analytics & custom reports",
      "Automated incident report generation",
      "Unlimited event retention",
      "Real-time alerts & notifications",
      "Job queue management",
      "Priority support",
    ],
    buttonText: "Get Started",
    variant: "pulse" as BrailleVariant,
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null as number | null,
    yearlyPrice: null as number | null,
    priceLabel: "Custom",
    description:
      "For organizations with mission-critical security and compliance requirements.",
    features: [
      "Unlimited cameras",
      "All Professional features",
      "Custom AI model configuration",
      "On-premise deployment",
      "Dedicated account manager",
      "Custom SLA guarantees",
      "White-label options",
      "Full API access",
    ],
    buttonText: "Contact Sales",
    variant: "vortex" as BrailleVariant,
    popular: false,
  },
];

const billingOptions = [
  { label: "Monthly", yearly: false },
  { label: "Yearly", yearly: true },
] as const;

function SegmentedToggle({
  isYearly,
  onChange,
}: {
  isYearly: boolean;
  onChange: (yearly: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-0 border border-border shrink-0">
      {billingOptions.map((option) => {
        const active = option.yearly === isYearly;
        return (
          <button
            key={option.label}
            onClick={() => onChange(option.yearly)}
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-5 py-2.5",
              option.yearly && "flex items-center gap-2",
              active
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.yearly && (
              <span
                className={cn(
                  "text-[0.625rem] font-bold px-1.5 py-0.5",
                  active
                    ? "bg-background/20 text-background"
                    : "bg-foreground/10 text-foreground",
                )}
              >
                −20%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PricingSection({ className }: { className?: string }) {
  const [isYearly, setIsYearly] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);

  return (
    <section
      id="pricing"
      className={cn(
        "w-full bg-background text-foreground border-border relative",
        className,
      )}
    >
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-20 lg:py-28 relative z-10">
        <div className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <h2 className="font-semibold text-5xl sm:text-6xl tracking-tight text-balance max-w-[14ch]">
              Pricing
            </h2>
            <p className="text-muted-foreground text-sm mt-3">
              Per seat. Cancel anytime.
            </p>
          </div>

          <SegmentedToggle isYearly={isYearly} onChange={setIsYearly} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
          {tiers.map((tier, idx) => {
            const isPopular = tier.popular;
            const price =
              tier.monthlyPrice !== null
                ? isYearly
                  ? tier.yearlyPrice
                  : tier.monthlyPrice
                : null;

            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: hover only drives a decorative background animation
              <div
                key={tier.name}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={cn(
                  "flex flex-col justify-between h-full group relative overflow-hidden transition-all duration-300 bg-background",
                  idx < tiers.length - 1 && "border-r border-border",
                )}
              >
                <MiniBrailleBg
                  variant={tier.variant}
                  active={hoveredIdx === idx}
                />

                <div className="p-8 lg:p-10 relative z-10 pt-10">
                  <h3 className="font-semibold text-3xl tracking-tight mb-2 text-foreground">
                    {tier.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-1 tabular-nums">
                    <span className="font-bold text-2xl tracking-tight text-foreground">
                      {price !== null ? `$${price}` : tier.priceLabel}
                    </span>
                    {price !== null && (
                      <span className="text-sm text-muted-foreground">
                        /seat/mo
                      </span>
                    )}
                  </div>

                  {price !== null && isYearly && (
                    <p className="text-xs text-muted-foreground mb-1">
                      billed annually
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground text-pretty mt-4 mb-10 min-h-[56px]">
                    {tier.description}
                  </p>

                  <ul className="space-y-4" role="list">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="size-4 shrink-0 mt-0.5 text-foreground opacity-50" />
                        <span className="text-sm text-foreground/80">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 lg:p-10 pt-0 relative z-10">
                  <button
                    type="button"
                    onClick={() => setNoticeOpen(true)}
                    className={cn(
                      "relative overflow-hidden w-full px-6 py-4 text-xs font-bold uppercase tracking-wider rounded-none",
                      isPopular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-secondary text-secondary-foreground hover:bg-foreground/10",
                    )}
                  >
                    {isPopular && <ButtonBrailleBg />}
                    <span className="relative z-10">{tier.buttonText}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          All paid plans include a 14-day free trial. No credit card required.
        </p>
      </div>

      <AlertDialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Coming soon</AlertDialogTitle>
            <AlertDialogDescription>
              Our general release is still in the works and not quite ready yet.
              Check back soon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
