import { cn } from "@/lib/utils";

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

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "w-full bg-background text-foreground border-t border-border",
        className,
      )}
    >
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5">
            <div className="font-semibold text-5xl sm:text-6xl lg:text-7xl tracking-tight">
              ARGUS
            </div>
            <p className="mt-6 text-sm text-muted-foreground max-w-[36ch] text-pretty">
              Computer vision, analytics, and an AI assistant — watching your
              streams so you don&apos;t have to.
            </p>
          </div>

          <div className="lg:col-span-7 lg:pl-8 lg:border-l border-border">
            <div className="grid grid-cols-2 gap-px bg-border border border-border">
              {contributors.map((p) => (
                <div key={p.n} className="bg-background p-6">
                  <div className="font-semibold text-xl tracking-tight">
                    {p.name}
                  </div>
                  <div className="mt-3 flex gap-4">
                    {p.links.map((l) => (
                      <a
                        key={l.label}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
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

        <div className="mt-10 pt-4 border-t border-border flex items-center justify-between text-[10px] tracking-widest uppercase text-muted-foreground">
          <span>© {new Date().getFullYear()} Argus</span>
          <span>v1.0</span>
        </div>
      </div>
    </footer>
  );
}
