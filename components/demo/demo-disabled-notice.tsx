import { IconInfoCircle } from "@tabler/icons-react";

export function DemoDisabledNotice({
  title = "Live streaming is disabled in this demo",
  description = "The browser → RTMP → Mux pipeline needs a persistent server and isn't available on the demo deployment. The rest of Argus is fully functional with sample data.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <div className="flex gap-3">
        <IconInfoCircle className="size-5 shrink-0 text-amber-500" />
        <div className="space-y-1">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            {title}
          </p>
          <p className="text-amber-900/80 dark:text-amber-200/80">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-900 dark:text-amber-200">
      <span className="size-1.5 rounded-full bg-amber-500" />
      Demo
    </span>
  );
}
