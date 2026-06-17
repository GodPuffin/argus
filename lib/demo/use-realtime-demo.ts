/**
 * Shared demo-mode helpers for the realtime hooks.
 *
 * In demo mode there is no Supabase backend: hooks serve static mock fixtures
 * and never open a realtime channel. These helpers remove the copy-pasted
 * boilerplate that branched on `isDemoMode` in every hook.
 */

import { type Dispatch, type SetStateAction, useState } from "react";
import { isDemoMode } from "@/lib/demo/flag";

/**
 * Initial `[data, loading]` state for a "list" realtime hook. In demo mode the
 * data starts as the provided mock fixture and `loading` is false (there is
 * nothing to fetch); otherwise it starts empty and loading.
 */
export function useDemoListState<T>(
  mock: T[],
): [
  T[],
  Dispatch<SetStateAction<T[]>>,
  boolean,
  Dispatch<SetStateAction<boolean>>,
] {
  const [data, setData] = useState<T[]>(isDemoMode ? mock : []);
  const [loading, setLoading] = useState(!isDemoMode);
  return [data, setData, loading, setLoading];
}
