"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { Progress } from "@base-ui/react/progress";
import { Check, Search, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Section, SectionInner } from "@/components/landing/section";
import { cn } from "@/lib/utils";

const DETECTIONS = [
  {
    label: "Unattended bag",
    camera: "Terminal B",
    severity: "critical",
    confidence: "91%",
    time: "14:31:12",
  },
  {
    label: "Loitering flagged",
    camera: "Main lobby",
    severity: "warning",
    confidence: "88%",
    time: "14:31:38",
  },
  {
    label: "Vehicle entering",
    camera: "North gate",
    severity: "info",
    confidence: "94%",
    time: "14:31:54",
  },
];

const SEARCH_RESULTS = [
  ["Loitering near loading bay", "CAM-02", "94%", "14:28-14:33"],
  ["Person re-entered frame", "CAM-02", "89%", "14:36-14:37"],
  ["Group lingering by door", "CAM-04", "81%", "21:12-21:18"],
];

const TOOL_STEPS = [
  {
    label: "Ingesting Stream...",
    tool: "mux.ingest_stream",
    output: 'stream: "CAM-02", status: "recording"',
  },
  {
    label: "Detecting Entities...",
    tool: "roboflow.detect_objects",
    output: 'entities: ["worker", "pallet_jack"], confidence: 0.91',
  },
  {
    label: "Detection analysis...",
    tool: "gemini.summarize_scene",
    output: 'summary: "worker moving loaded pallet through dock"',
  },
  {
    label: "Adding index to ElasticSearch...",
    tool: "elasticsearch.index_event",
    output: 'index: "analysis_events", searchable: true',
  },
  {
    label: "Documenting Event...",
    tool: "reports.create_event_note",
    output: 'event: "loading dock activity", status: "documented"',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useCycle(length: number, intervalMs: number, enabled: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setIndex((previous) => (previous + 1) % length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, length]);

  return index;
}

function AppShell({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xl shadow-neutral-950/5 dark:bg-neutral-950 dark:shadow-none">
      <div className="flex items-center justify-between bg-secondary/40 p-3 dark:bg-white/[0.03]">
        <div className="flex shrink-0 gap-1.5">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </div>
        <div className="min-w-0 rounded-md bg-background/80 px-3 py-1 dark:bg-black/20">
          <p className="truncate text-[0.6875rem] font-medium text-muted-foreground dark:text-white/60">
            {label}
          </p>
        </div>
        <div className="size-9" />
      </div>
      {children}
    </div>
  );
}

function LiveDot({ tone = "ok" }: { tone?: "ok" | "warn" | "alert" }) {
  return (
    <span
      className={cn(
        "relative flex size-2 shrink-0 items-center justify-center rounded-full",
        tone === "ok" && "bg-emerald-500",
        tone === "warn" && "bg-amber-500",
        tone === "alert" && "bg-red-500",
      )}
    >
      <span
        className={cn(
          "absolute size-full rounded-full animate-ping motion-reduce:hidden",
          tone === "ok" && "bg-emerald-500",
          tone === "warn" && "bg-amber-500",
          tone === "alert" && "bg-red-500",
        )}
      />
    </span>
  );
}

function WorkflowCopy({
  step,
  eyebrow,
  title,
  description,
  points,
}: {
  step: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <div className="flex flex-col justify-center gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-primary">
          {step} / {eyebrow}
        </p>
        <h3 className="max-w-[24ch] text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h3>
        <p className="max-w-[48ch] text-lg text-muted-foreground text-pretty sm:text-base">
          {description}
        </p>
      </div>
      <ul className="grid gap-3">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 dark:bg-primary/15">
              <Check className="size-4 shrink-0 stroke-primary" aria-hidden />
            </span>
            <p className="text-base text-foreground/80 sm:text-sm">{point}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ToolStepState = "complete" | "loading" | "queued";

function StepProgress({ state }: { state: ToolStepState }) {
  const value = state === "complete" ? 100 : state === "loading" ? null : 0;

  return (
    <Progress.Root
      value={value}
      aria-valuetext={
        state === "loading"
          ? "Running"
          : state === "complete"
            ? "Complete"
            : "Queued"
      }
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        state === "complete" && "bg-emerald-500/10 dark:bg-emerald-400/10",
        state === "loading" && "bg-primary/10 dark:bg-primary/15",
        state === "queued" && "bg-secondary/60 dark:bg-white/[0.04]",
      )}
    >
      <Progress.Track className="relative flex size-4 items-center justify-center rounded-full">
        {state === "complete" ? (
          <Check
            className="size-4 shrink-0 stroke-emerald-600 dark:stroke-emerald-400"
            aria-hidden
          />
        ) : null}
        {state === "loading" ? (
          <Progress.Indicator className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        ) : null}
        {state === "queued" ? (
          <span className="size-1.5 rounded-full bg-muted-foreground/40 dark:bg-white/30" />
        ) : null}
      </Progress.Track>
    </Progress.Root>
  );
}

function ToolCallStep({
  item,
  state,
}: {
  item: (typeof TOOL_STEPS)[number];
  state: ToolStepState;
}) {
  const open = state === "loading";

  return (
    <Collapsible.Root open={open} className="grid gap-2">
      <Collapsible.Trigger
        disabled
        className="flex cursor-default items-start gap-3 rounded-lg bg-card/90 p-4 text-left dark:bg-white/[0.04]"
      >
        <StepProgress state={state} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-base font-medium text-foreground sm:text-sm dark:text-white",
              state === "queued" && "text-muted-foreground dark:text-white/40",
            )}
          >
            {item.label}
          </p>
          <p className="truncate text-[0.6875rem] text-muted-foreground dark:text-white/45">
            {item.tool}
          </p>
        </div>
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <AnimatePresence mode="wait">
          {open ? (
            <motion.pre
              key={item.tool}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="overflow-hidden rounded-lg bg-secondary/70 p-3 text-[0.75rem] text-muted-foreground dark:bg-black/30 dark:text-white/65"
            >
              {item.output}
            </motion.pre>
          ) : null}
        </AnimatePresence>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function ToolCallCard({
  name,
  status = "completed",
  children,
}: {
  name: string;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-card/90 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4 bg-secondary/35 p-3 dark:bg-black/20">
        <p className="truncate text-base font-medium sm:text-sm dark:text-white">
          {name}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <LiveDot />
          <p className="text-[0.6875rem] font-medium text-muted-foreground dark:text-white/50">
            {status}
          </p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function IngestCard({ active }: { active: number }) {
  return (
    <AppShell label="argus.io/pipeline/live">
      <div className="p-5 sm:p-6">
        <div className="rounded-xl bg-secondary/45 p-5 sm:p-6 dark:bg-white/[0.04]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-base font-medium sm:text-sm dark:text-white">
              Agent run
            </p>
            <p className="text-[0.6875rem] font-medium text-muted-foreground dark:text-white/45">
              video pipeline
            </p>
          </div>

          <ol className="grid gap-3">
            {TOOL_STEPS.map((item, index) => {
              const state: ToolStepState =
                index < active
                  ? "complete"
                  : index === active
                    ? "loading"
                    : "queued";

              return (
                <li key={item.tool} className="grid gap-2">
                  <ToolCallStep item={item} state={state} />
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}

function DetectionCard({ active }: { active: number }) {
  const selected = DETECTIONS[active];

  return (
    <AppShell label="argus.io/events/triage">
      <div className="p-5 sm:p-6">
        <ToolCallCard name="roboflow.detect_objects">
          <pre className="overflow-hidden text-[0.75rem] text-muted-foreground">
            {`{
  object: "${selected.label}",
  camera: "${selected.camera}",
  confidence: "${selected.confidence}",
  severity: "${selected.severity}"
}`}
          </pre>
        </ToolCallCard>
      </div>
    </AppShell>
  );
}

function SearchCard({ active }: { active: number }) {
  const [label, camera, score, range] = SEARCH_RESULTS[active];

  return (
    <AppShell label="argus.io/search/evidence">
      <div className="grid gap-5 p-5 sm:p-6">
        <div className="grid gap-4 rounded-xl bg-secondary/45 p-4 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <Search
              className="size-4 h-lh shrink-0 stroke-muted-foreground"
              aria-hidden
            />
            <p className="min-w-0 flex-1 truncate text-base font-medium sm:text-sm">
              people loitering near the loading bay after 9pm
            </p>
            <Sparkles
              className="size-4 h-lh shrink-0 stroke-primary"
              aria-hidden
            />
          </div>
          <div className="relative h-16 overflow-hidden rounded-lg bg-background/80 dark:bg-black/20">
            <motion.div
              animate={{ x: ["-8%", "86%"] }}
              transition={{ duration: 4.4, repeat: Number.POSITIVE_INFINITY }}
              className="absolute inset-y-0 w-1 rounded-full bg-primary"
            />
            <div className="grid h-full grid-cols-12 gap-px">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static timeline divisions
                  key={index}
                  className={cn(
                    "bg-border/40",
                    [2, 5, 9].includes(index) && "bg-primary/20",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <ToolCallCard name="elasticsearch.semantic_search">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-base font-medium text-pretty sm:text-sm">
                {label}
              </p>
              <p className="mt-1 truncate text-base text-muted-foreground sm:text-sm">
                {camera} / {range}
              </p>
            </div>
            <p className="shrink-0 text-base font-medium tabular-nums sm:text-sm">
              {score}
            </p>
          </div>
        </ToolCallCard>
      </div>
    </AppShell>
  );
}

function AssistantCard({ active }: { active: number }) {
  const actions = [
    ["Flagged event", "Warning severity applied"],
    ["Opened clip", "CAM-05 at 14:31:54"],
    ["Drafted report", "Ready for supervisor review"],
  ];

  return (
    <AppShell label="argus.io/copilot/incident">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[5fr_7fr]">
        <ToolCallCard name="assistant.answer">
          <div className="grid gap-3">
            <p className="text-base text-muted-foreground sm:text-sm">
              What happened at the north gate?
            </p>
            <p className="text-xl font-medium tracking-tight">
              Three events, one warning, and one linked clip are ready.
            </p>
          </div>
        </ToolCallCard>

        <ToolCallCard name="reports.create_incident_brief">
          <pre className="overflow-hidden text-[0.75rem] text-muted-foreground">
            {`{
  summary: "Vehicle idled for five minutes",
  evidence: "3 clips / 2 cameras",
  status: "${actions[active][0]}"
}`}
          </pre>
        </ToolCallCard>
      </div>
    </AppShell>
  );
}

function WorkflowStory({
  reverse = false,
  copy,
  children,
}: {
  reverse?: boolean;
  copy: React.ComponentProps<typeof WorkflowCopy>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.22 }}
      className="grid gap-10 py-16 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-24"
    >
      <div className={cn(reverse && "lg:order-2")}>
        <WorkflowCopy {...copy} />
      </div>
      <div className={cn(reverse && "lg:order-1")}>{children}</div>
    </motion.div>
  );
}

export function WorkflowPipeline() {
  const reduced = useReducedMotion();
  const pipelineStep = useCycle(TOOL_STEPS.length, 6500, !reduced);
  const detectionStep = useCycle(DETECTIONS.length, 7000, !reduced);
  const searchStep = useCycle(SEARCH_RESULTS.length, 7200, !reduced);
  const assistantStep = useCycle(3, 7600, !reduced);

  return (
    <Section id="workflow" className="scroll-mt-24 overflow-hidden">
      <SectionInner>
        <div className="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="text-sm font-medium text-primary">Product workflow</p>
            <h2 className="mt-4 max-w-[20ch] text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              From raw video to review-ready intelligence.
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-4 border-border lg:col-span-5 lg:border-l lg:pl-8">
            <p className="max-w-[48ch] text-lg text-muted-foreground text-pretty sm:text-base">
              Argus works like a product workflow, not a wall of camera feeds.
              Each stream becomes structured events, searchable evidence, and
              assistant-ready context.
            </p>
          </div>
        </div>

        <WorkflowStory
          copy={{
            step: "01",
            eyebrow: "Ingest",
            title: "Every stream enters the same clean processing path.",
            description:
              "Live feeds move through ingest, detection, analysis, indexing, and realtime surfacing without asking an operator to manage the pipeline.",
            points: [
              "RTMP ingest through Mux.",
              "Frame-level detection with Roboflow.",
              "Gemini summaries indexed for search.",
            ],
          }}
        >
          <IngestCard active={pipelineStep} />
        </WorkflowStory>

        <WorkflowStory
          reverse
          copy={{
            step: "02",
            eyebrow: "Detect",
            title: "Events arrive as prioritized work, not visual noise.",
            description:
              "Argus pulls the important moments forward with confidence, severity, camera, and location already attached.",
            points: [
              "Critical events stand apart from routine detections.",
              "Operators can triage without opening every clip.",
              "Realtime updates keep the queue current.",
            ],
          }}
        >
          <DetectionCard active={detectionStep} />
        </WorkflowStory>

        <WorkflowStory
          copy={{
            step: "03",
            eyebrow: "Search",
            title: "Find the moment by describing what happened.",
            description:
              "Semantic search turns months of footage into a queryable evidence layer across cameras, summaries, labels, and reports.",
            points: [
              "Plain-language queries over indexed events.",
              "Ranked clip matches with confidence scores.",
              "Searches across camera context and generated reports.",
            ],
          }}
        >
          <SearchCard active={searchStep} />
        </WorkflowStory>

        <WorkflowStory
          reverse
          copy={{
            step: "04",
            eyebrow: "Assistant",
            title: "Ask for the answer, then move straight to action.",
            description:
              "The assistant explains what happened, opens the right clip, flags the incident, and drafts the report from the same evidence trail.",
            points: [
              "Answers grounded in camera events.",
              "One flow for investigation and handoff.",
              "Reports generated from the verified incident trail.",
            ],
          }}
        >
          <AssistantCard active={assistantStep} />
        </WorkflowStory>
      </SectionInner>
    </Section>
  );
}
