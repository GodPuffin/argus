# `demo-site` Branch Quality Pass — Progress

**Goal:** Go through the entirety of the `demo-site` branch and what this code
affects. Use the ui.sh code-organization skills (`improve-codebase-architecture`,
`componentize`, `canonicalize-tailwind`) to reach 10/10 quality: proper reusable
components and interfaces, clean code, proper abstraction, organized properly,
dead code removed, bloat comments removed.

**Status:** In progress — paused at user request. This is a WIP checkpoint, not a
finished pass. See "Remaining" below.

## Approach

The branch is large (96 files differ from `master`, plus heavy uncommitted work).
Work was split into five disjoint groups, each audited by a read-only agent
(concrete `file:line` findings: dead code, bloat comments, duplication, shallow
modules, leaky abstractions), then cleaned:

- **A — Data layer:** `lib/demo/*`, `lib/chat-store.ts`, `lib/ai-tools.ts`, `lib/prompts.ts`, `app/api/chat/route.ts`, `app/api/search/route.ts`
- **B — Onboarding:** `app/onboarding/*`, `components/onboarding/*`, `hooks/use-demo-session.ts`
- **C — Landing:** `app/page.tsx`, `app/layout.tsx`, `components/landing/*`, site chrome
- **D — Dashboard viz:** `components/stats/*` (17 charts), realtime hooks, `use-chart-animation`
- **E — Dashboard shell & shared:** `app/(dashboard)/*`, shared components (sidebar, headers, surface, watch/stream/jobs, ui)

## Done

- **Group A (data layer) — complete.** Added `extractTextFromParts()` shared
  helper (used by `chat-store` title derivation + `api/chat` route), removed
  `as any`/double-cast on message parts, consolidated demo type imports onto
  `lib/demo/types.ts` as the single source of truth (kept the `session-store`
  re-export because cross-group files still import via it), removed restatement
  comments in `ai-tools.ts` / `rate-limit.ts`.
- **Group B (onboarding) — complete.** `OnboardingToolOutput` is now a proper
  discriminated union (removed defensive `?.` chaining); shared input class
  extracted to `ONBOARDING_INPUT_CLASS`; the three bespoke primary buttons now
  reuse the `Button` component (preserving tap animation via `asChild`); added
  `className` merge to 6 components.
- **Group C (landing) — complete.** Deleted the duplicate `utils/cn.ts` (and the
  now-empty `utils/` dir); `browser-component` switched to `@/lib/utils` + theme
  tokens + extracted window-dot; `style-manifest` `CtaSection`/`FeatureBlock` now
  funnel through the single `SectionInner` container (harmonized width/padding);
  hero CTAs reuse `Button`/`CtaLink`; `feature-shot` baked margin removed;
  pricing template-literal classes moved to `cn()`.
- **Group D (charts) — complete.** Created `components/stats/chart-shell.tsx`
  exporting `ChartShell` (Card+header+background+empty-state frame),
  `EmptyChartState`, `ChartFootnote`, and `buildDynamicChartConfig`. **All 16
  data charts** were rewritten onto these primitives — this removed the
  duplicated card/empty-state boilerplate (~−1700 net lines across the branch)
  and the repeated dynamic-config reducer, and dropped dead recharts imports
  (`Legend`, `ResponsiveContainer`, `Cell` where unused).

## Remaining (to resume)

1. **Group D — realtime hooks (NOT done).** The chart components are finished but
   the hook cleanup is not. Outstanding (from the viz audit):
   - `hooks/use-events-realtime.ts` and `hooks/use-camera-realtime.ts` duplicate
     the demo-mode branch instead of using the shared `useDemoListState`
     (`lib/demo/use-realtime-demo.ts`). Add a `useDemoSingleState` variant for
     the single-entity case (`use-camera-realtime`) and migrate both.
   - `hooks/use-cameras-realtime.ts` has contradictory demo init: it calls
     `useDemoListState(mockCameras)` then overrides the return with `demoCameras`
     in demo mode (lines ~10–11 vs ~102–106). Reconcile to one path.
   - `hooks/use-stats-realtime.ts`: verify `updateCount`/`lastUpdate` are consumed;
     remove if dead.
   - `lib/chart-colors.ts`: make `hexToHSL` / `COLORBLIND_SAFE_PALETTE` private if
     only used internally.
2. **Group E — shell & shared (PARTIAL).** The cleanup agent was stopped
   mid-run. Some edits landed (search-page comment/dedup, watch `alert()`→toast,
   first-run-card tokens, stream-controls `className` merge, page-header
   `className`, database-page tabs/title) but verification did not finish. Known
   loose ends to check: a possibly-unused `IconHelpCircle` import in
   `components/watch/recording-info-modal.tsx`, and a `useExhaustiveDependencies`
   warning in `app/(dashboard)/search/page.tsx:~218` after removing
   `hasActiveFilters` from a callback dep array. Re-run the audit fixes for this
   group and verify.
3. **Final verification (NOT done).** No full `tsc`/`biome`/`next build` has been
   run over the combined result yet.

## Verification posture

`next.config.ts` sets `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds`,
so the build never fails on type/lint errors. A full `tsc --noEmit` has ~baseline
pre-existing errors in unrelated files only: `supabase/functions/**`, `worker/**`,
`components/tiptap-ui-primitive/**`, `components/dither.tsx`,
`components/ui/shadcn-io/code-block/server.tsx`, `lib/elasticsearch-stats.ts`,
`lib/tracking-stats.ts`, `.next/types/validator.ts`. **Verify per touched file,
not against the global count.** Each completed group was checked with
`biome check` + filtered `tsc` and showed no new errors in its files; the merged
result and Groups D-hooks/E still need a final pass.

## Key new shared modules

- `components/stats/chart-shell.tsx` — `ChartShell`, `EmptyChartState`, `ChartFootnote`, `buildDynamicChartConfig`
- `lib/chat-store.ts` — `extractTextFromParts()`
- onboarding: `ONBOARDING_INPUT_CLASS`, `toolLabel()`, discriminated `OnboardingToolEvent`
