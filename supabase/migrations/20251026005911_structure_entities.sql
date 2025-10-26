-- Create Entity Type Enum
-- Defines standardized entity types for AI analysis to enable proper statistics tracking

-- Create enum type for entity types
create type public.entity_type as enum (
  'person',
  'vehicle',
  'car',
  'truck',
  'bus',
  'motorcycle',
  'bicycle',
  'animal',
  'pet',
  'dog',
  'cat',
  'package',
  'bag',
  'backpack',
  'weapon',
  'phone',
  'laptop',
  'object',
  'location',
  'activity',
  'other'
);

-- Add comment for documentation
comment on type public.entity_type is 'Standardized entity types detected in video analysis for statistics and filtering';

-- Note: Entities are stored as JSONB in ai_analysis_results.entities and ai_analysis_events.affected_entities
-- The enum provides type validation for the application layer and enables future query optimization
-- Each entity object in JSONB should have structure: { type: entity_type, name: text, confidence: float }

