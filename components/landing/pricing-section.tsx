"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

const tiers = [
  {
    name: "Self-Hosted",
    monthlyPrice: null as number | null,
    yearlyPrice: null as number | null,
    priceLabel: "Free",
    description: "For developers who want full control over their own infrastructure.",
    features: [
      "Bring Your Own Key (BYOK)",
      "1 camera stream",
      "Basic AI threat detection",
      "Community support",
      "Standard rate limits",
    ],
    buttonText: "Deploy for free",
    variant: "matrix" as const,
    popular: false,
  },
  {
    name: "Starter",
    monthlyPrice: 299,
    yearlyPrice: 239,
    priceLabel: null as string | null,
    description: "For small teams securing physical spaces with intelligent monitoring.",
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
    variant: "wave" as const,
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 699,
    yearlyPrice: 559,
    priceLabel: null as string | null,
    description: "For security teams that need the full power of agentic AI surveillance.",
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
    variant: "pulse" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null as number | null,
    yearlyPrice: null as number | null,
    priceLabel: "Custom",
    description: "For organizations with mission-critical security and compliance requirements.",
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
    variant: "vortex" as const,
    popular: false,
  },
];

const DENSITY_CHARS = Array.from({ length: 256 }, (_, i) => {
  let count = 0;
  for (let b = 0; b < 8; b++) {
    if ((i >> b) & 1) count++;
  }
  return { char: String.fromCharCode(0x2800 + i), count };
}).sort((a, b) => a.count - b.count).map(x => x.char);

function MiniBrailleBg({ variant }: { variant: "matrix" | "wave" | "pulse" | "vortex" }) {
  const [grid, setGrid] = useState<string[][]>([]);

  useEffect(() => {
    const rows = 25;
    const cols = 45;
    let frameCount = 0;

    const drops = Array.from({ length: cols }, () => ({
      y: Math.random() * -rows,
      speed: 0.2 + Math.random() * 0.5,
      length: 5 + Math.random() * 10
    }));

    const id = setInterval(() => {
      frameCount++;
      const next: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(""));

      for (let c = 0; c < cols; c++) {
        if (variant === "matrix") {
          drops[c].y += drops[c].speed;
          if (drops[c].y - drops[c].length > rows) {
            drops[c].y = Math.random() * -10;
            drops[c].speed = 0.2 + Math.random() * 0.5;
          }
        }
      }


      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let v = 0;
          if (variant === "matrix") {
            const drop = drops[c];
            const dist = drop.y - r;
            if (dist >= 0 && dist < drop.length) {
              v = 1 - (dist / drop.length);
              v = v * 0.8 + Math.random() * 0.2;
            } else {
              v = Math.random() > 0.98 ? Math.random() * 0.2 : 0;
            }
          } else if (variant === "wave") {
            const phase1 = frameCount * 0.1 + c * 0.2;
            const phase2 = frameCount * 0.05 + c * 0.1;
            const y1 = Math.sin(phase1) * 5 + rows / 2;
            const y2 = Math.cos(phase2) * 5 + rows / 2;
            const dist1 = Math.abs(r - y1);
            const dist2 = Math.abs(r - y2);
            const dist = Math.min(dist1, dist2);
            v = dist < 4 ? 1 - (dist / 4) : 0;
            v = v * (0.7 + Math.random() * 0.3);
          } else if (variant === "pulse") {
            const t = frameCount * 0.05;
            const x1 = cols / 2 + Math.sin(t) * 10;
            const y1 = rows / 2 + Math.cos(t * 1.3) * 5;
            const x2 = cols / 2 + Math.cos(t * 0.8) * 15;
            const y2 = rows / 2 + Math.sin(t * 1.1) * 8;
            const d1 = Math.sqrt(Math.pow(c - x1, 2) + Math.pow((r - y1) * 2, 2));
            const d2 = Math.sqrt(Math.pow(c - x2, 2) + Math.pow((r - y2) * 2, 2));
            v = Math.max(
              d1 < 12 ? 1 - d1 / 12 : 0,
              d2 < 12 ? 1 - d2 / 12 : 0
            );
            if (v > 0) v = v * 0.8 + Math.random() * 0.2;
          } else if (variant === "vortex") {
            const t = frameCount * 0.04;
            const cx = cols / 2;
            const cy = rows / 2;
            const dx = c - cx;
            const dy = (r - cy) * 2.2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            // Two counter-rotating spiral arms tightening toward center
            const spiralPhase = angle - dist * 0.35 + t * 2.5;
            const arm = Math.pow(Math.max(0, Math.cos(spiralPhase * 2)), 2);
            const falloff = dist < 22 ? Math.pow(1 - dist / 22, 0.6) : 0;
            v = arm * falloff;
            // Inner core glow
            if (dist < 3) v = Math.max(v, 0.6 + Math.random() * 0.4);
            if (v > 0) v = v * (0.75 + Math.random() * 0.25);
          }

          const charIdx = Math.min(255, Math.max(0, Math.floor(v * 255)));
          next[r][c] = DENSITY_CHARS[charIdx];
        }
      }
      setGrid(next);
    }, 50);

    return () => clearInterval(id);
  }, [variant]);

  let colorClass = "";
  let duration = "8s";
  if (variant === "matrix") {
    colorClass = "from-emerald-400/90 via-teal-500/70 to-emerald-600/90";
    duration = "8s";
  } else if (variant === "wave") {
    colorClass = "from-orange-400/90 via-amber-500/70 to-rose-600/90";
    duration = "12s";
  } else if (variant === "pulse") {
    colorClass = "from-indigo-400/90 via-purple-500/70 to-blue-600/90";
    duration = "10s";
  } else if (variant === "vortex") {
    colorClass = "from-yellow-300/90 via-rose-500/80 to-red-700/90";
    duration = "6s";
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <style>{`
        @keyframes braille-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="absolute top-0 left-0 right-0 flex items-start justify-center">
        <div
          className={`font-mono text-[16px] leading-[16px] tracking-[0.25em] whitespace-pre pt-4 bg-clip-text text-transparent bg-gradient-to-br ${colorClass}`}
          style={{
            backgroundSize: "200% 200%",
            animation: `braille-gradient-shift ${duration} ease infinite`,
          }}
        >
          {grid.map((row, i) => (
            <div key={i}>{row.join("")}</div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/90 to-background" />
    </div>
  );
}

function ButtonBrailleBg() {
  const [grid, setGrid] = useState<string[][]>([]);

  useEffect(() => {
    const rows = 8;
    const cols = 50;
    let frameCount = 0;

    const id = setInterval(() => {
      frameCount++;
      const next: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(""));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * 0.15;
          const y = r * 0.3;
          const t = frameCount * 0.06;

          const n1 = Math.sin(x + t);
          const n2 = Math.cos(y - t * 0.8);
          const n3 = Math.sin(x * 0.5 + y * 0.5 + t * 1.2);

          const noise = (n1 + n2 + n3) / 3;

          let v = noise * 0.5 + 0.5;
          v = v > 0.55 ? (v - 0.55) * 2.2 : 0;

          const charIdx = Math.min(255, Math.max(0, Math.floor(v * 255)));
          next[r][c] = DENSITY_CHARS[charIdx];
        }
      }
      setGrid(next);
    }, 50);

    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.65] flex items-center justify-center"
      style={{
        maskImage: "radial-gradient(ellipse at center, transparent 45%, black 100%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, transparent 45%, black 100%)",
      }}
    >
      <div className="font-mono text-[8px] leading-[8px] tracking-[0.2em] whitespace-pre text-background">
        {grid.map((row, i) => (
          <div key={i}>{row.join("")}</div>
        ))}
      </div>
    </div>
  );
}

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="w-full bg-background text-foreground border-border relative">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-20 lg:py-28 relative z-10">
        <div className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <h2 className="font-[family-name:var(--font-inter)] font-semibold text-5xl sm:text-6xl tracking-tight text-balance max-w-[14ch]">
              Pricing
            </h2>
            <p className="font-[family-name:var(--font-inter)] text-muted-foreground text-sm mt-3">
              Per seat. Cancel anytime.
            </p>
          </div>

          <div className="flex items-center gap-0 border border-border shrink-0">
            <button
              onClick={() => setIsYearly(false)}
              className={`font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-wider px-5 py-2.5 ${!isYearly
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-wider px-5 py-2.5 flex items-center gap-2 ${isYearly
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Yearly
              <span
                className={`text-[0.625rem] font-bold px-1.5 py-0.5 ${isYearly
                  ? "bg-background/20 text-background"
                  : "bg-foreground/10 text-foreground"
                  }`}
              >
                −20%
              </span>
            </button>
          </div>
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
              <div
                key={tier.name}
                className={`flex flex-col justify-between h-full group relative overflow-hidden transition-all duration-300 bg-background ${idx < tiers.length - 1 ? "border-r border-border" : ""
                  }`}
              >
                <MiniBrailleBg variant={tier.variant} />

                <div className="p-8 lg:p-10 relative z-10 pt-10">
                  <h3 className="font-[family-name:var(--font-inter)] font-semibold text-3xl tracking-tight mb-2 text-foreground">
                    {tier.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-1 tabular-nums">
                    <span className="font-[family-name:var(--font-inter)] font-bold text-2xl tracking-tight text-foreground">
                      {price !== null ? `$${price}` : tier.priceLabel}
                    </span>
                    {price !== null && (
                      <span className="font-[family-name:var(--font-inter)] text-sm text-muted-foreground">
                        /seat/mo
                      </span>
                    )}
                  </div>

                  {price !== null && isYearly && (
                    <p className="font-[family-name:var(--font-inter)] text-xs text-muted-foreground mb-1">
                      billed annually
                    </p>
                  )}

                  <p className="font-[family-name:var(--font-inter)] text-sm text-muted-foreground text-pretty mt-4 mb-10 min-h-[56px]">
                    {tier.description}
                  </p>

                  <ul className="space-y-4" role="list">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="size-4 shrink-0 mt-0.5 text-foreground opacity-50" />
                        <span className="font-[family-name:var(--font-inter)] text-sm text-foreground/80">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 lg:p-10 pt-0 relative z-10">
                  <button
                    className={`relative overflow-hidden w-full px-6 py-4 text-xs font-bold font-[family-name:var(--font-inter)] uppercase tracking-wider rounded-none ${isPopular
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-secondary text-secondary-foreground hover:bg-foreground/10"
                      }`}
                  >
                    {isPopular && <ButtonBrailleBg />}
                    <span className="relative z-10">{tier.buttonText}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="font-[family-name:var(--font-inter)] text-xs text-muted-foreground mt-6">
          All paid plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
