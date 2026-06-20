"use client";

import {
  Activity,
  ArrowUpRight,
  Check,
  Database,
  type LucideIcon,
  Radio,
  ScanEye,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Section, SectionInner } from "@/components/landing/section";
import { cn } from "@/lib/utils";

/* ───────────────────────── shared data ───────────────────────── */

type Stage = { code: string; label: string; vendor: string; icon: LucideIcon };

const STAGES: Stage[] = [
  { code: "01", label: "Ingest", vendor: "Mux · RTMP", icon: Radio },
  { code: "02", label: "Detect", vendor: "Roboflow", icon: ScanEye },
  { code: "03", label: "Analyze", vendor: "Gemini", icon: Sparkles },
  { code: "04", label: "Index", vendor: "Elasticsearch", icon: Database },
  { code: "05", label: "Surface", vendor: "Realtime", icon: Activity },
];

type Severity = "info" | "warn" | "alert";

type EventDef = {
  type: string;
  cam: string;
  time: string;
  conf: number;
  sev: Severity;
};

const EVENTS: EventDef[] = [
  { type: "Person detected", cam: "CAM-02 · Loading Bay", time: "14:32:07", conf: 97, sev: "info" },
  { type: "Vehicle entering", cam: "CAM-05 · North Gate", time: "14:31:54", conf: 94, sev: "info" },
  { type: "Loitering flagged", cam: "CAM-01 · Main Lobby", time: "14:31:38", conf: 88, sev: "warn" },
  { type: "Unattended bag", cam: "CAM-07 · Terminal B", time: "14:31:12", conf: 91, sev: "alert" },
  { type: "Crowd forming", cam: "CAM-03 · West Plaza", time: "14:30:45", conf: 86, sev: "warn" },
  { type: "Tailgating detected", cam: "CAM-09 · Side Entry", time: "14:30:21", conf: 90, sev: "warn" },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  info: "text-muted-foreground border-border",
  warn: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10",
  alert: "text-destructive border-destructive/30 bg-destructive/10",
};

type Query = {
  text: string;
  results: { label: string; cam: string; score: number }[];
};

const QUERIES: Query[] = [
  {
    text: "people loitering near the loading bay after 9pm",
    results: [
      { label: "Loitering · 4 min dwell", cam: "CAM-02 · Loading Bay", score: 0.94 },
      { label: "Person re-entered frame", cam: "CAM-02 · Loading Bay", score: 0.89 },
      { label: "Group lingering by door", cam: "CAM-04 · Dock 3", score: 0.81 },
    ],
  },
  {
    text: "unattended bags in the terminal today",
    results: [
      { label: "Unattended bag · 2 min", cam: "CAM-07 · Terminal B", score: 0.96 },
      { label: "Object left on bench", cam: "CAM-08 · Gate 12", score: 0.84 },
    ],
  },
  {
    text: "vehicles idling at the north gate this hour",
    results: [
      { label: "Truck idling > 5 min", cam: "CAM-05 · North Gate", score: 0.92 },
      { label: "Vehicle entering", cam: "CAM-05 · North Gate", score: 0.88 },
      { label: "Vehicle exiting", cam: "CAM-06 · North Gate", score: 0.8 },
    ],
  },
];

type ChatMessage = { role: "user" | "assistant"; text: string; chips?: string[] };

const CHAT: ChatMessage[] = [
  { role: "user", text: "What happened at the north gate in the last hour?" },
  {
    role: "assistant",
    text: "Three events. A vehicle entered at 14:31, a truck idled for over five minutes, then a vehicle exited.",
    chips: ["Vehicle entering", "Truck idling", "Vehicle exiting"],
  },
  { role: "user", text: "Flag the idling truck and open the clip." },
  {
    role: "assistant",
    text: "Flagged as a warning and pinned to your review queue. Opening CAM-05 at 14:31:54.",
    chips: ["CAM-05 · 14:31:54"],
  },
];

/* ───────────────────────── helpers ───────────────────────── */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useCycle(length: number, intervalMs: number, enabled: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(
      () => setIndex((p) => (p + 1) % length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [length, intervalMs, enabled]);
  return index;
}

function LiveDot({ color = "var(--linear-success)" }: { color?: string }) {
  return (
    <span className="relative flex size-2 items-center justify-center">
      <span
        className="absolute inline-flex size-full rounded-full animate-ping motion-reduce:hidden"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

/* ───────────────────────── workflow 1 · pipeline ───────────────────────── */

function PipelineFlow({ reduced }: { reduced: boolean }) {
  const active = useCycle(STAGES.length, 1100, !reduced);
  const fillPct = ((active + 1) / STAGES.length) * 100;
  const dotPct = ((active + 0.5) / STAGES.length) * 100;

  return (
    <div className="p-6 lg:p-8">
      <div className="relative mx-1 mb-5 hidden h-px bg-border lg:block">
        {!reduced && (
          <>
            <span
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 ease-out"
              style={{ width: `${fillPct}%` }}
            />
            <span
              className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-background transition-all duration-700 ease-out"
              style={{ left: `${dotPct}%` }}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage, i) => {
          const isActive = !reduced && i === active;
          const Icon = stage.icon;
          return (
            <div
              key={stage.code}
              className={cn(
                "relative flex flex-col gap-3 bg-background p-4 transition-colors lg:p-5",
                isActive && "bg-secondary/40",
              )}
            >
              {isActive && (
                <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
              )}
              <div className="flex items-center justify-between">
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground tabular-nums">
                  {stage.code}
                </span>
              </div>
              <div>
                <div className="font-medium text-sm tracking-tight">
                  {stage.label}
                </div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stage.vendor}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── workflow 2 · live feed ───────────────────────── */

type FeedItem = { id: number; event: number };

const SEED_FEED: FeedItem[] = [
  { id: 4, event: 4 },
  { id: 3, event: 3 },
  { id: 2, event: 2 },
  { id: 1, event: 1 },
  { id: 0, event: 0 },
];

function EventFeed({ reduced }: { reduced: boolean }) {
  const [feed, setFeed] = useState<FeedItem[]>(SEED_FEED);
  const idRef = useRef(SEED_FEED.length);
  const eventRef = useRef(SEED_FEED.length - 1);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      eventRef.current = (eventRef.current + 1) % EVENTS.length;
      const next: FeedItem = { id: idRef.current, event: eventRef.current };
      idRef.current += 1;
      setFeed((prev) => [next, ...prev].slice(0, 5));
    }, 2300);
    return () => clearInterval(id);
  }, [reduced]);

  const newestId = feed[0]?.id ?? -1;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="font-medium text-sm">Live detections</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground tabular-nums">
          {feed.length} events
        </span>
      </div>
      <ul className="divide-y divide-border">
        {feed.map((item) => {
          const e = EVENTS[item.event];
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5",
                item.id === newestId &&
                  "animate-feed-in motion-reduce:animate-none",
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center border border-border bg-secondary/40">
                <ScanEye className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-sm">{e.type}</span>
                  <span
                    className={cn(
                      "shrink-0 border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                      SEVERITY_STYLES[e.sev],
                    )}
                  >
                    {e.sev}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {e.cam} · {e.time}
                </p>
              </div>
              <div className="hidden w-24 shrink-0 flex-col items-end gap-1.5 sm:flex">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {e.conf}%
                </span>
                <span className="h-1 w-full overflow-hidden bg-secondary">
                  <span
                    className="block h-full bg-foreground/40"
                    style={{ width: `${e.conf}%` }}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────────────────────── workflow 3 · semantic search ───────────────────────── */

function SemanticSearch({ reduced }: { reduced: boolean }) {
  const [qIndex, setQIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (reduced) {
      setTyped(QUERIES[0].text.length);
      setShowResults(true);
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    void (async () => {
      let qi = 0;
      while (!cancelled) {
        setQIndex(qi);
        setShowResults(false);
        setTyped(0);
        const text = QUERIES[qi].text;
        for (let c = 1; c <= text.length; c++) {
          if (cancelled) return;
          setTyped(c);
          await wait(42);
        }
        await wait(450);
        if (cancelled) return;
        setShowResults(true);
        await wait(2800);
        qi = (qi + 1) % QUERIES.length;
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [reduced]);

  const query = QUERIES[qIndex];
  const typedText = query.text.slice(0, typed);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3 border border-border bg-secondary/30 px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm text-foreground">
            {typedText}
            {!reduced && (
              <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-foreground animate-pulse motion-reduce:hidden" />
            )}
          </span>
        </div>
      </div>
      <div className="flex-1 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {showResults ? `${query.results.length} matches` : "Searching…"}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Elasticsearch agent
          </span>
        </div>
        <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {showResults
            ? query.results.map((r, i) => (
                <div
                  key={r.label}
                  className="flex animate-feed-in flex-col gap-2 bg-background p-4 motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground tabular-nums">
                      {(r.score * 100).toFixed(0)}% match
                    </span>
                    <ArrowUpRight
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                  <span className="text-pretty font-medium text-sm tracking-tight">
                    {r.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {r.cam}
                  </span>
                </div>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                  key={i}
                  className="flex flex-col gap-2.5 bg-background p-4"
                >
                  <div className="h-3 w-16 bg-secondary" />
                  <div className="h-4 w-3/4 bg-secondary" />
                  <div className="h-3 w-1/2 bg-secondary" />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── workflow 4 · assistant ───────────────────────── */

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex animate-feed-in gap-3 motion-reduce:animate-none",
        isUser && "flex-row-reverse",
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center border border-border",
          isUser ? "bg-secondary" : "bg-primary/10",
        )}
      >
        {isUser ? (
          <User className="size-3.5 text-muted-foreground" aria-hidden />
        ) : (
          <Sparkles className="size-3.5 text-primary" aria-hidden />
        )}
      </div>
      <div className={cn("flex max-w-[78%] flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "text-pretty border px-3.5 py-2.5 text-sm",
            isUser
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background",
          )}
        >
          {message.text}
        </div>
        {message.chips && (
          <div className={cn("flex flex-wrap gap-1.5", isUser && "justify-end")}>
            {message.chips.map((chip) => (
              <span
                key={chip}
                className="border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex animate-feed-in gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center border border-border bg-primary/10">
        <Sparkles className="size-3.5 text-primary" aria-hidden />
      </div>
      <div className="flex items-center gap-1 border border-border bg-background px-3.5 py-3">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  );
}

function AssistantChat({ reduced }: { reduced: boolean }) {
  const [shown, setShown] = useState(reduced ? CHAT.length : 0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    void (async () => {
      while (!cancelled) {
        setShown(0);
        setTyping(false);
        await wait(700);
        for (let i = 0; i < CHAT.length; i++) {
          if (cancelled) return;
          if (CHAT[i].role === "assistant") {
            setTyping(true);
            await wait(1100);
            if (cancelled) return;
            setTyping(false);
          } else {
            await wait(500);
          }
          if (cancelled) return;
          setShown(i + 1);
          await wait(CHAT[i].role === "assistant" ? 1500 : 900);
        }
        await wait(3000);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [reduced]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <span className="font-medium text-sm">AI assistant</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Claude · Gemini
        </span>
      </div>
      <div className="flex min-h-[300px] flex-1 flex-col justify-end gap-3 p-5">
        {CHAT.slice(0, shown).map((message, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed scripted transcript
          <ChatBubble key={i} message={message} />
        ))}
        {typing && <TypingBubble />}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 border border-border bg-secondary/30 px-3 py-2">
          <span className="flex-1 truncate text-sm text-muted-foreground">
            Ask anything…
          </span>
          <span className="flex size-7 items-center justify-center bg-foreground text-background">
            <Send className="size-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── row layout ───────────────────────── */

function WorkflowRow({
  eyebrow,
  title,
  description,
  points,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 border border-border lg:grid-cols-12">
      <div className="flex flex-col justify-center gap-6 p-8 lg:col-span-4 lg:border-r border-border lg:p-10">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </span>
          <h3 className="max-w-[18ch] text-balance font-medium text-2xl sm:text-3xl tracking-tight">
            {title}
          </h3>
          <p className="max-w-[44ch] text-pretty text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <ul className="flex flex-col gap-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2.5">
              <Check className="size-3.5 shrink-0 text-foreground opacity-50" />
              <span className="text-sm text-foreground/80">{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative lg:col-span-8">{children}</div>
    </div>
  );
}

/* ───────────────────────── section ───────────────────────── */

export function Workflows() {
  const reduced = useReducedMotion();

  return (
    <Section id="workflow" className="scroll-mt-24">
      <SectionInner>
        <div className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              How it works
            </span>
            <h2 className="mt-4 max-w-[14ch] text-balance font-semibold text-5xl sm:text-6xl lg:text-[64px] tracking-tight">
              The system, in motion.
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-4 border-border lg:col-span-5 lg:border-l lg:pl-8">
            <p className="max-w-[44ch] text-pretty text-base text-muted-foreground">
              Four live workflows — the ingest pipeline, the detection feed,
              semantic search, and the AI assistant — running the same loop
              you&apos;d see in production.
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <WorkflowRow
            eyebrow="Ingest pipeline"
            title="From stream to event"
            description="Every frame runs the same path — ingested, detected, analyzed, indexed, and surfaced in near real time."
            points={[
              "RTMP ingest via Mux",
              "Edge detection with Roboflow",
              "Summarized by Gemini",
            ]}
          >
            <PipelineFlow reduced={reduced} />
          </WorkflowRow>

          <WorkflowRow
            eyebrow="Live detections"
            title="Events as they happen"
            description="Detections stream into a single feed the moment they're flagged, ranked by confidence and triaged by severity."
            points={[
              "Confidence scoring",
              "Severity triage",
              "Realtime via Supabase",
            ]}
          >
            <EventFeed reduced={reduced} />
          </WorkflowRow>

          <WorkflowRow
            eyebrow="Semantic search"
            title="Ask in plain language"
            description="Search months of footage by describing what you're looking for — the Elasticsearch agent does the rest."
            points={[
              "Natural-language queries",
              "Months of footage",
              "Ranked, scored results",
            ]}
          >
            <SemanticSearch reduced={reduced} />
          </WorkflowRow>

          <WorkflowRow
            eyebrow="AI assistant"
            title="Answers, not footage"
            description="Ask questions, flag events, and generate reports in one conversation with your entire camera network."
            points={[
              "Cross-camera context",
              "One-click flagging",
              "Report generation",
            ]}
          >
            <AssistantChat reduced={reduced} />
          </WorkflowRow>
        </div>
      </SectionInner>
    </Section>
  );
}
