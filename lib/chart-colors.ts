/**
 * Consistent color palette for charts
 * Ensures tags/entities use the same colors across all visualizations
 */

export const ENTITY_TYPE_COLORS: Record<string, string> = {
  person: "hsl(220, 70%, 50%)", // Blue
  object: "hsl(30, 75%, 55%)", // Orange
  location: "hsl(142, 70%, 45%)", // Green
  vehicle: "hsl(280, 65%, 60%)", // Purple
  animal: "hsl(160, 60%, 45%)", // Teal
  unknown: "hsl(0, 0%, 50%)", // Gray
}

// Generate consistent colors for tags based on their content
export function getTagColor(tag: string): string {
  // Check if it matches known entity types
  const lowerTag = tag.toLowerCase()
  
  if (lowerTag === 'person' || lowerTag === 'people' || lowerTag === 'man' || lowerTag === 'woman') {
    return ENTITY_TYPE_COLORS.person
  }
  if (lowerTag === 'vehicle' || lowerTag === 'car' || lowerTag === 'truck') {
    return ENTITY_TYPE_COLORS.vehicle
  }
  if (lowerTag === 'animal' || lowerTag === 'dog' || lowerTag === 'cat') {
    return ENTITY_TYPE_COLORS.animal
  }
  if (lowerTag === 'location' || lowerTag === 'place' || lowerTag === 'building') {
    return ENTITY_TYPE_COLORS.location
  }
  
  // Use a hash-based color for other tags
  return hashStringToColor(tag)
}

// Generate a consistent color from a string
function hashStringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash % 360)
  const saturation = 65 + (Math.abs(hash) % 20) // 65-85%
  const lightness = 45 + (Math.abs(hash >> 8) % 15) // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export function getEntityTypeColor(type: string): string {
  return ENTITY_TYPE_COLORS[type.toLowerCase()] || ENTITY_TYPE_COLORS.unknown
}

