/** Shared, locale-aware display formatters used across dashboard surfaces. */

/** Compact relative age of a timestamp, e.g. "just now", "5m ago", "3d ago". */
export function relativeTime(timestamp: string | null): string {
  if (!timestamp) return "—";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/** Formats a duration in seconds as `m:ss`; returns `fallback` for empty values. */
export function formatClockDuration(
  seconds: number | null | undefined,
  fallback = "—",
): string {
  if (!seconds) return fallback;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}
