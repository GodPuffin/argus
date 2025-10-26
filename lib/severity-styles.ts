/**
 * Consistent severity styling utilities
 * Used across the application for High/Medium/Minor severity displays
 */

export type Severity = "High" | "Medium" | "Minor";

/**
 * Get badge background styles for severity levels
 */
export function getSeverityBadgeStyles(severity: Severity | string): string {
  const styles: Record<string, string> = {
    High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Minor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };
  return (
    styles[severity] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  );
}

/**
 * Get text color for severity levels
 */
export function getSeverityTextColor(severity: Severity | string): string {
  const colors: Record<string, string> = {
    High: "text-red-600 dark:text-red-400",
    Medium: "text-yellow-600 dark:text-yellow-400",
    Minor: "text-gray-600 dark:text-gray-400",
  };
  return colors[severity] || "text-gray-600";
}

/**
 * Get background color for severity visualization (charts, markers, etc.)
 */
export function getSeverityBgColor(severity: Severity | string): string {
  const colors: Record<string, string> = {
    High: "bg-red-500 hover:bg-red-600",
    Medium: "bg-yellow-500 hover:bg-yellow-600",
    Minor: "bg-gray-400 hover:bg-gray-500",
  };
  return colors[severity] || "bg-gray-400";
}

/**
 * Get HSL color for severity (used in charts)
 */
export function getSeverityChartColor(severity: Severity | string): string {
  const colors: Record<string, string> = {
    High: "hsl(0, 80%, 55%)", // Red
    Medium: "hsl(45, 93%, 47%)", // Yellow
    Minor: "hsl(189, 85%, 40%)", // Blue (matching event display)
  };
  return colors[severity] || "hsl(0, 0%, 50%)";
}
