"use client";

import { IconMessageCircle, IconPlayerPlay, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FirstRunNextStepsCard({
  onDismiss,
  onOpenRecordings,
}: {
  onDismiss: () => void;
  onOpenRecordings: () => void;
}) {
  return (
    <section className="mb-4 rounded-lg border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
          <IconPlayerPlay className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Workspace launched
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your onboarding cameras are now merged into the demo dashboard.
                Next, ask AI about the setup or open a recording.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss next steps"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              asChild
              className="h-auto gap-2 px-3 py-2 text-xs text-white"
            >
              <Link href="/ai-chat">
                <IconMessageCircle className="size-3.5" />
                Ask AI
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onOpenRecordings}
              className="h-auto gap-2 px-3 py-2 text-xs shadow-none"
            >
              <IconPlayerPlay className="size-3.5" />
              Open recordings
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
