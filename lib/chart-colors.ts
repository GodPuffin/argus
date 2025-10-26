/**
 * Perceptually uniform color palettes for charts
 * Using D3's HCL (Hue-Chroma-Luminance) color space for colorblind-safe,
 * distinct colors with good luminance contrast for dark backgrounds.
 */

import { hcl } from "d3-color";
import { scaleOrdinal, scaleSequential } from "d3-scale";
import { interpolateRainbow, schemeTableau10 } from "d3-scale-chromatic";

/**
 * Generate perceptually uniform colors using HCL color space
 * This ensures even spacing in perceived color difference
 */
export function generateHCLColors(
  count: number,
  options?: {
    hueStart?: number;
    hueEnd?: number;
    chroma?: number;
    luminance?: number;
  },
): string[] {
  const {
    hueStart = 0,
    hueEnd = 360,
    chroma = 60, // Moderate saturation for good visibility
    luminance = 65, // Good contrast on dark backgrounds
  } = options || {};

  const colors: string[] = [];
  const hueStep = (hueEnd - hueStart) / Math.max(count, 1);

  for (let i = 0; i < count; i++) {
    const hue = (hueStart + i * hueStep) % 360;
    const color = hcl(hue, chroma, luminance);
    colors.push(color.formatHex());
  }

  return colors;
}

/**
 * Convert hex to HSL string for compatibility with existing chart configs
 */
export function hexToHSL(hex: string): string {
  const color = hcl(hex);
  const h = Math.round(color.h || 0);
  const c = Math.round((color.c / 100) * 100); // Chroma as percentage
  const l = Math.round((color.l / 100) * 100); // Luminance as percentage
  return `hsl(${h}, ${c}%, ${l}%)`;
}

/**
 * Colorblind-safe palette based on Tableau 10
 * Optimized for distinguishability and dark backgrounds
 */
export const COLORBLIND_SAFE_PALETTE = [
  hcl(210, 70, 65).formatHex(), // Blue
  hcl(25, 75, 62).formatHex(), // Orange
  hcl(130, 65, 58).formatHex(), // Green
  hcl(355, 72, 60).formatHex(), // Red
  hcl(280, 58, 68).formatHex(), // Purple
  hcl(45, 68, 63).formatHex(), // Yellow
  hcl(165, 55, 60).formatHex(), // Teal
  hcl(325, 65, 65).formatHex(), // Pink
  hcl(90, 60, 62).formatHex(), // Lime
  hcl(190, 60, 60).formatHex(), // Cyan
];

/**
 * Chart-specific color palettes
 * Each chart gets a unique but cohesive color theme
 */

// Job Status Chart - Sequential from pending to complete
export const JOB_STATUS_COLORS = {
  queued: hcl(210, 45, 72).toString(), // Light blue (pending)
  processing: hcl(45, 75, 65).toString(), // Yellow (in progress)
  succeeded: hcl(130, 70, 58).toString(), // Green (success)
  failed: hcl(15, 80, 58).toString(), // Red-orange (error)
  dead: hcl(0, 65, 45).toString(), // Dark red (critical)
};

// Stream Status Chart - Status indicators
export const STREAM_STATUS_COLORS = {
  active: hcl(140, 75, 60).toString(), // Vibrant green (active)
  idle: hcl(35, 70, 65).toString(), // Warm orange (idle)
  disabled: hcl(0, 55, 55).toString(), // Muted red (disabled)
};

// Detection Classes - Wide hue range for variety
export const DETECTION_CLASS_COLORS = generateHCLColors(20, {
  hueStart: 0,
  hueEnd: 340,
  chroma: 68,
  luminance: 63,
}).map(hexToHSL);

// Event Types - Vibrant, distinct colors
export const EVENT_TYPE_COLORS = [
  hcl(355, 75, 62).toString(), // Red
  hcl(30, 78, 64).toString(), // Orange
  hcl(140, 72, 58).toString(), // Green
  hcl(210, 70, 65).toString(), // Blue
  hcl(280, 65, 68).toString(), // Purple
  hcl(165, 62, 62).toString(), // Teal
  hcl(50, 75, 66).toString(), // Yellow
  hcl(320, 68, 66).toString(), // Pink
  hcl(95, 65, 60).toString(), // Lime
  hcl(260, 60, 64).toString(), // Violet
];

// Entity Types - Semantic colors with good differentiation
export const ENTITY_TYPE_COLORS: Record<string, string> = {
  person: hcl(210, 75, 65).toString(), // Blue (human)
  object: hcl(30, 78, 64).toString(), // Orange (things)
  location: hcl(140, 72, 58).toString(), // Green (places)
  vehicle: hcl(280, 65, 68).toString(), // Purple (transport)
  animal: hcl(165, 65, 62).toString(), // Teal (nature)
  unknown: hcl(0, 0, 58).toString(), // Gray (undefined)
};

// Timeline Charts - Complementary colors for multiple series
export const DETECTIONS_TIMELINE_COLORS = {
  detections: hcl(355, 78, 63).toString(), // Vibrant red
  frames: hcl(35, 75, 65).toString(), // Bright orange
};

export const JOBS_TIMELINE_COLORS = {
  created: hcl(210, 70, 65).toString(), // Blue
  succeeded: hcl(140, 72, 58).toString(), // Green
  failed: hcl(10, 80, 58).toString(), // Red
};

// Area Charts - Single color with gradient support
export const OCCUPANCY_COLOR = hcl(280, 68, 65).toString(); // Purple (people)
export const PROCESSING_VOLUME_COLOR = hcl(195, 68, 62).toString(); // Cyan (activity)

/**
 * Generate consistent colors for tags based on their content
 * Uses HCL space for perceptual uniformity
 */
export function getTagColor(tag: string): string {
  const lowerTag = tag.toLowerCase();

  // Check if it matches known entity types
  if (
    lowerTag === "person" ||
    lowerTag === "people" ||
    lowerTag === "man" ||
    lowerTag === "woman"
  ) {
    return ENTITY_TYPE_COLORS.person;
  }
  if (lowerTag === "vehicle" || lowerTag === "car" || lowerTag === "truck") {
    return ENTITY_TYPE_COLORS.vehicle;
  }
  if (lowerTag === "animal" || lowerTag === "dog" || lowerTag === "cat") {
    return ENTITY_TYPE_COLORS.animal;
  }
  if (
    lowerTag === "location" ||
    lowerTag === "place" ||
    lowerTag === "building"
  ) {
    return ENTITY_TYPE_COLORS.location;
  }

  // Use a hash-based color generation with HCL
  return hashStringToHCLColor(tag);
}

/**
 * Generate a consistent HCL-based color from a string
 */
function hashStringToHCLColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  const chroma = 62 + (Math.abs(hash) % 15); // 62-77
  const luminance = 60 + (Math.abs(hash >> 8) % 10); // 60-70

  return hcl(hue, chroma, luminance).toString();
}

export function getEntityTypeColor(type: string): string {
  return ENTITY_TYPE_COLORS[type.toLowerCase()] || ENTITY_TYPE_COLORS.unknown;
}

/**
 * Get a color from the colorblind-safe palette by index
 */
export function getColorblindSafeColor(index: number): string {
  return hexToHSL(
    COLORBLIND_SAFE_PALETTE[index % COLORBLIND_SAFE_PALETTE.length],
  );
}
