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

const DENSITY_CHARS = Array.from({ length: 256 }, (_, i) => {
  let count = 0;
  for (let b = 0; b < 8; b++) {
    if ((i >> b) & 1) count++;
  }
  return { char: String.fromCharCode(0x2800 + i), count };
}).sort((a, b) => a.count - b.count).map(x => x.char);

function MiniBrailleBg({ variant }: { variant: "matrix" | "wave" | "pulse" }) {
  const [grid, setGrid] = useState<string[][]>([]);

  useEffect(() => {
    const rows = 25;
    const cols = 45;
    let frameCount = 0;
    
    // For matrix variant, keeping track of drop positions
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
              v = v * 0.8 + Math.random() * 0.2; // Add flicker
            } else {
              v = Math.random() > 0.98 ? Math.random() * 0.2 : 0; // Random background static
            }
          } else if (variant === "wave") {
            // Flowing horizontal wave with interference
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
            // Organic glowing spots
            const t = frameCount * 0.05;
            const x1 = cols / 2 + Math.sin(t) * 10;
            const y1 = rows / 2 + Math.cos(t * 1.3) * 5;
            
            const x2 = cols / 2 + Math.cos(t * 0.8) * 15;
            const y2 = rows / 2 + Math.sin(t * 1.1) * 8;
            
            const d1 = Math.sqrt(Math.pow(c - x1, 2) + Math.pow((r - y1)*2, 2));
            const d2 = Math.sqrt(Math.pow(c - x2, 2) + Math.pow((r - y2)*2, 2));
            
            v = Math.max(
              d1 < 12 ? 1 - d1/12 : 0,
              d2 < 12 ? 1 - d2/12 : 0
            );
            
            // Add subtle noise to the pulse
            if (v > 0) v = v * 0.8 + Math.random() * 0.2;
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
            backgroundSize: '200% 200%',
            animation: `braille-gradient-shift ${duration} ease infinite`
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
          
          // Organic fluid noise combining multiple sine waves to simulate water/fire
          const n1 = Math.sin(x + t);
          const n2 = Math.cos(y - t * 0.8);
          const n3 = Math.sin(x * 0.5 + y * 0.5 + t * 1.2);
          
          const noise = (n1 + n2 + n3) / 3; // roughly -1 to 1
          
          // Map to 0-1
          let v = noise * 0.5 + 0.5;
          
          // Threshold to create sparse flowing "islands" of braille
          v = v > 0.55 ? (v - 0.55) * 2.2 : 0;
          
          const charIdx = Math.min(255, Math.max(0, Math.floor(v * 255)));
          next[r][c] = DENSITY_CHARS[charIdx];
        }
      }
      setGrid(next);
    }, 50); // 20fps for smooth character transitions

    return () => clearInterval(id);
  }, []);

  return (
    <div 
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.65] flex items-center justify-center"
      style={{
        maskImage: 'radial-gradient(ellipse at center, transparent 45%, black 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 45%, black 100%)'
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
  return (
    <section id="pricing" className="w-full bg-background text-foreground border-border relative">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-20 lg:py-28 relative z-10">
        <div className="mb-14">
          <h2 className="font-[family-name:var(--font-inter)] font-semibold text-5xl sm:text-6xl tracking-tight text-balance max-w-[14ch]">
            Pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const isStarter = tier.name === "Starter";
            const isSelfHosted = tier.name === "Self-hosted";
            const isProfessional = tier.name === "Professional";

            let variant: "matrix" | "wave" | "pulse" = "matrix";
            if (isStarter) variant = "wave";
            if (isProfessional) variant = "pulse";

            return (
              <div key={tier.name} className={`flex flex-col h-full border group relative overflow-hidden transition-all duration-300 rounded-none ${
                isStarter
                  ? "bg-background border-border"
                  : "bg-background border-border/60 hover:border-border"
              }`}>
                
                <MiniBrailleBg variant={variant} />

                <div className="p-8 lg:p-10 flex-1 relative z-10 pt-12">
                  <h3 className="font-[family-name:var(--font-inter)] font-semibold text-3xl tracking-tight mb-2 text-foreground">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-[family-name:var(--font-inter)] font-bold text-4xl tracking-tight text-foreground">
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
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-foreground opacity-50" />
                        <span className="font-[family-name:var(--font-inter)] text-sm text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-8 lg:p-10 pt-0 mt-auto relative z-10">
                  <button className={`relative overflow-hidden w-full px-6 py-4 text-xs font-bold transition-colors font-[family-name:var(--font-inter)] uppercase tracking-wider rounded-none ${
                    isStarter
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-secondary text-secondary-foreground hover:bg-foreground/10"
                    }`}>
                    {isStarter && (
                      <ButtonBrailleBg />
                    )}
                    <span className="relative z-10">{tier.buttonText}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

