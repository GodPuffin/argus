"use client";

import { useChat } from "@ai-sdk/react";
import { IconCheck } from "@tabler/icons-react";
import { DefaultChatTransport, generateId } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { applyToolEvent } from "@/components/onboarding/apply-tool-event";
import { AssemblySequence } from "@/components/onboarding/assembly-sequence";
import { CollapsibleCopilotPanel } from "@/components/onboarding/collapsible-copilot-panel";
import { ConfirmLaunch } from "@/components/onboarding/confirm-launch";
import {
  isOnboardingToolType,
  toolLabel,
} from "@/components/onboarding/constants";
import { OnboardingHero } from "@/components/onboarding/onboarding-hero";
import type {
  OnboardingPhase,
  OnboardingToolEvent,
  ToolPart,
} from "@/components/onboarding/onboarding-types";
import { ReviewCanvas } from "@/components/onboarding/review-canvas";
import { isBusy } from "@/components/onboarding/status";
import { useDemoSession } from "@/hooks/use-demo-session";
import { completeOnboarding, reset } from "@/lib/demo/session-store";

/** AI model that drives the onboarding copilot. */
const ONBOARDING_MODEL = "onboarding-guide";

/** Delay before redirecting to the live dashboard after launch. */
const LAUNCH_REDIRECT_MS = 1600;

/** Stagger for revealing assembly events: first one is quick, the rest pace out. */
const FIRST_REVEAL_MS = 300;
const NEXT_REVEAL_MS = 620;

/** Settle delay before advancing from "assembling" to "review". */
const ASSEMBLY_SETTLE_MS = 850;

export function OnboardingWizard() {
  const router = useRouter();
  const session = useDemoSession();
  const [phase, setPhase] = useState<OnboardingPhase>("hero");
  const [input, setInput] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<OnboardingToolEvent[]>([]);
  const [revealedEvents, setRevealedEvents] = useState<OnboardingToolEvent[]>(
    [],
  );
  const [visibleToolCallIds, setVisibleToolCallIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [assemblyObservedTurn, setAssemblyObservedTurn] = useState(false);

  const [chatId] = useState(() => generateId());
  const sessionRef = useRef(session);
  const discoveredRef = useRef<Set<string>>(new Set());
  const appliedRef = useRef<Set<string>>(new Set());
  const assemblyStartMessageCountRef = useRef(0);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          chatId,
          onboarding: true,
          model: ONBOARDING_MODEL,
          sessionContext: {
            hasOrgName: !!sessionRef.current.orgName,
            cameraNames: sessionRef.current.cameras.map((c) => c.camera_name),
            ruleLabels: sessionRef.current.detectionRules.map((r) => r.label),
          },
        }),
      }),
    [chatId],
  );

  const { messages, sendMessage, status } = useChat({ id: chatId, transport });
  const busy = isBusy(status);

  const handleFinish = useCallback(() => {
    if (finishing) return;
    completeOnboarding(true);
    setFinishing(true);
    window.setTimeout(() => router.push("/watch"), LAUNCH_REDIRECT_MS);
  }, [finishing, router]);

  const applyEvent = useCallback((event: OnboardingToolEvent) => {
    if (appliedRef.current.has(event.id)) return;
    appliedRef.current.add(event.id);
    if (applyToolEvent(event)) setPhase("confirm");
  }, []);

  useEffect(() => {
    if (
      phase === "assembling" &&
      messages.length > assemblyStartMessageCountRef.current
    ) {
      setAssemblyObservedTurn(true);
    }

    const discovered: OnboardingToolEvent[] = [];
    for (const message of messages) {
      for (const part of message.parts) {
        const type = part.type as string;
        if (!isOnboardingToolType(type)) continue;
        const p = part as ToolPart;
        if (p.state !== "output-available") continue;
        const callId = p.toolCallId ?? `${message.id}:${type}`;
        if (discoveredRef.current.has(callId)) continue;
        discoveredRef.current.add(callId);

        const output = p.output ?? {};
        // `type` is validated by isOnboardingToolType above; the streamed output
        // is loosely typed, so assert the discriminated-union member here.
        discovered.push({
          id: callId,
          type,
          output,
          label: toolLabel(type, output),
        } as OnboardingToolEvent);
      }
    }

    if (!discovered.length) return;
    setAssemblyObservedTurn(true);

    if (phase === "assembling") {
      setPendingEvents((current) => [...current, ...discovered]);
      return;
    }

    setVisibleToolCallIds((current) => {
      const next = new Set(current);
      for (const event of discovered) next.add(event.id);
      return next;
    });
    for (const event of discovered) applyEvent(event);
  }, [applyEvent, messages, phase]);

  useEffect(() => {
    if (phase !== "assembling" || pendingEvents.length === 0) return;

    const timeout = window.setTimeout(
      () => {
        const [nextEvent] = pendingEvents;
        setPendingEvents((current) => current.slice(1));
        setRevealedEvents((current) => [...current, nextEvent]);
        setVisibleToolCallIds((current) => {
          const next = new Set(current);
          next.add(nextEvent.id);
          return next;
        });
        applyEvent(nextEvent);
      },
      revealedEvents.length === 0 ? FIRST_REVEAL_MS : NEXT_REVEAL_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [applyEvent, pendingEvents, phase, revealedEvents.length]);

  useEffect(() => {
    if (phase !== "assembling" || busy || pendingEvents.length > 0) return;
    if (!assemblyObservedTurn) return;

    const timeout = window.setTimeout(
      () => setPhase("review"),
      ASSEMBLY_SETTLE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [assemblyObservedTurn, busy, pendingEvents.length, phase]);

  const handleHeroSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    assemblyStartMessageCountRef.current = messages.length;
    setAssemblyObservedTurn(false);
    setPendingEvents([]);
    setRevealedEvents([]);
    setPhase("assembling");
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleCopilotSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleManual = () => {
    reset();
    setPendingEvents([]);
    setRevealedEvents([]);
    setPhase("review");
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {(phase === "hero" || phase === "assembling") && (
        <div className="fixed right-4 top-4 z-20">
          <ModeToggle />
        </div>
      )}
      {phase !== "hero" && phase !== "assembling" && (
        <header className="flex h-12 shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]">
              Argus setup
            </span>
            <Link
              href="/watch"
              className="text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              Skip to dashboard
            </Link>
          </div>
          <ModeToggle />
        </header>
      )}

      <AnimatePresence mode="wait">
        {phase === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <OnboardingHero
              input={input}
              status={status}
              onInputChange={setInput}
              onSubmit={handleHeroSubmit}
              onManual={handleManual}
            />
          </motion.div>
        )}

        {phase === "assembling" && (
          <motion.div
            key="assembling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AssemblySequence events={revealedEvents} busy={busy} />
          </motion.div>
        )}

        {phase === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden lg:flex-row"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ReviewCanvas
                session={session}
                onConfirm={() => setPhase("confirm")}
              />
            </div>
            <CollapsibleCopilotPanel
              messages={messages}
              status={status}
              input={input}
              onInputChange={setInput}
              onSend={handleCopilotSend}
              visibleToolCallIds={visibleToolCallIds}
            />
          </motion.div>
        )}

        {phase === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <ConfirmLaunch
              session={session}
              finishing={finishing}
              onBack={() => setPhase("review")}
              onLaunch={handleFinish}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {finishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--background)]/90 backdrop-blur"
          >
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-white"
            >
              <IconCheck className="size-7" />
            </motion.span>
            <p className="text-lg font-medium text-[var(--foreground)]">
              {session.orgName ?? "Your workspace"} is ready
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Taking you to the live dashboard...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
