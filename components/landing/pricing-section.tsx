"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

const tiers = [
  {
    name: "Self-hosted",
    price: "$0",
    description: "Perfect for exploring the platform and personal projects.",
    features: ["Bring Your Own Key (BYOK)", "Standard rate limits", "Community Support", "Basic AI Chat"],
    buttonText: "Start for free",
  },
  {
    name: "Starter",
    price: "$19",
    period: "/mo",
    description: "For enthusiasts and serious personal use cases.",
    features: ["Bring Your Own Key (BYOK)", "Extended limits", "Email Support", "Advanced AI Chat", "30-day retention"],
    buttonText: "Get Started",
  },
  {
    name: "Professional",
    price: "$49",
    period: "/mo",
    description: "For teams and businesses needing maximum power.",
    features: ["Bring Your Own Key (BYOK)", "Extended limits", "Priority Support", "Unlimited retention", "Custom integrations"],
    buttonText: "Contact Sales",
  },
];

const BRAILLE_CHARS = Array.from({ length: 256 }, (_, i) => String.fromCharCode(0x2800 + i));

function MiniBrailleBg() {
  const [grid, setGrid] = useState<string[][]>([]);

  useEffect(() => {
    const rows = 10;
    const cols = 35;

    const getNewGrid = () => Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => BRAILLE_CHARS[Math.floor(Math.random() * BRAILLE_CHARS.length)])
    );

    setGrid(getNewGrid());

    const id = setInterval(() => {
      setGrid(prev => {
        if (!prev.length) return prev;
        const next = [...prev.map(row => [...row])];
        for (let i = 0; i < 10; i++) {
          const r = Math.floor(Math.random() * rows);
          const c = Math.floor(Math.random() * cols);
          next[r][c] = BRAILLE_CHARS[Math.floor(Math.random() * BRAILLE_CHARS.length)];
        }
        return next;
      });
    }, 80);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 flex items-center justify-center opacity-20">
      <div className="font-mono text-[8px] leading-none tracking-widest text-foreground whitespace-pre">
        {grid.map((row, i) => (
          <div key={i}>{row.join("")}</div>
        ))}
      </div>
    </div>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="w-full bg-background text-foreground border-border">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-20 lg:py-28">
        <div className="mb-14">
          <h2 className="font-[family-name:var(--font-inter)] font-semibold text-5xl sm:text-6xl tracking-tight text-balance max-w-[14ch]">
            Pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <div key={tier.name} className={`flex flex-col h-full border group relative overflow-hidden transition-colors ${tier.name === "Starter"
              ? "bg-muted border-border/95"
              : "bg-muted/80 border-border/80"
              }`}>

              <div className="h-32 w-full border-border relative overflow-hidden flex items-center justify-center bg-muted/5 group-hover:bg-muted/10 transition-colors">
                <MiniBrailleBg />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
              </div>

              <div className="p-8 lg:p-10 flex-1 relative z-10">
                <h3 className="font-[family-name:var(--font-inter)] font-semibold text-3xl tracking-tight mb-2">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-[family-name:var(--font-inter)] font-bold text-2xl tracking-tight">
                    {tier.price}
                  </span>
                  {tier.period && <span className="font-[family-name:var(--font-inter)] text-muted-foreground">{tier.period}</span>}
                </div>
                <p className="font-[family-name:var(--font-inter)] text-sm text-muted-foreground text-pretty mb-10 min-h-[40px]">
                  {tier.description}
                </p>
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-foreground opacity-50 shrink-0 mt-0.5" />
                      <span className="font-[family-name:var(--font-inter)] text-xs text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 lg:p-10 pt-0 mt-auto relative z-10">
                <button className={`w-full px-6 py-4 text-xs font-bold transition-colors font-[family-name:var(--font-inter)] uppercase tracking-wider ${tier.name === "Starter"
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-secondary text-secondary-foreground hover:bg-foreground/85 hover:text-background"
                  }`}>
                  {tier.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
