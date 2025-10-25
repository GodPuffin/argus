# Elasticsearch Integration

This module provides a clean, type-safe interface for Elasticsearch operations in the application.

## Table of Contents

- [Setup](#setup)
- [Configuration](#configuration)
- [Types](#types)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Setup

### 1. Install Dependencies

```bash
pnpm install @elastic/elasticsearch
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
ELASTICSEARCH_URL=https://your-cluster-url:9200
ELASTICSEARCH_API_KEY=your_api_key_here
```

### 3. Initialize Index

The index will be automatically created on first search if it doesn't exist, or you can manually ensure it exists:

```typescript
import { ensureIndexExists } from '@/lib/elasticsearch'

await ensureIndexExists()
```

## Configuration

### Constants

- `ELASTICSEARCH_INDEX`: `'content'` - The name of the Elasticsearch index
- `SEARCH_RESULT_SIZE`: `20` - Maximum number of search results returned

### Index Mapping

The index uses the following field mappings:

| Field | Type | Description |
|-------|------|-------------|
| `type` | keyword | Content type (stream/camera/recording) |
| `title` | text + keyword | Searchable title with exact match support |
| `description` | text | Full-text searchable description |
| `content` | text | Full-text searchable content |
| `tags` | keyword | Array of tags for filtering |
| `created_at` | date | Document creation timestamp |
| `updated_at` | date | Document update timestamp |
| `metadata` | object | Flexible metadata storage |

## Types

### ContentType

```typescript
type ContentType = 'stream' | 'camera' | 'recording'
```

### ContentDocument

```typescript
interface ContentDocument {
  type: ContentType
  title: string
  description?: string
  content?: string
  tags?: string[]
  created_at: string  // ISO 8601 format
  updated_at: string  // ISO 8601 format
  metadata?: Record<string, any>
}
```

### SearchFilters

```typescript
interface SearchFilters {
  type?: ContentType
  dateRange?: {
    from: string  // ISO 8601 format
    to: string    // ISO 8601 format
  }
}
```

### SearchHit

```typescript
interface SearchHit {
  id: string
  score: number
  source: ContentDocument
  highlights?: Record<string, string[]>
}
```

### SearchResult

```typescript
interface SearchResult {
  hits: SearchHit[]
  total: number
  took: number  // Milliseconds
}
```

## API Reference

### Search Operations

#### `searchContent(query: string, filters?: SearchFilters): Promise<SearchResult>`

Performs a full-text search across all indexed content.

**Features:**
- Multi-field search with title boosting (2x)
- Fuzzy matching for typo tolerance
- Highlighting of matching terms
- Optional type and date range filtering

**Example:**

```typescript
import { searchContent } from '@/lib/elasticsearch'

// Basic search
const results = await searchContent('security camera')

// Search with filters
const results = await searchContent('camera', {
  type: 'camera',
  dateRange: {
    from: '2024-01-01T00:00:00Z',
    to: '2024-12-31T23:59:59Z'
  }
})
```

### Document Operations

#### `indexDocument(id: string, document: ContentDocument): Promise<void>`

Indexes a single document. The document becomes immediately searchable.

**Example:**

```typescript
import { indexDocument } from '@/lib/elasticsearch'

await indexDocument('camera-123', {
  type: 'camera',
  title: 'Front Door Camera',
  description: 'Main entrance security camera',
  tags: ['security', 'entrance'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    location: 'Front Door',
    resolution: '1080p'
  }
})
```

#### `updateDocument(id: string, updates: Partial<ContentDocument>): Promise<void>`

Updates specific fields of an existing document.

**Example:**

```typescript
import { updateDocument } from '@/lib/elasticsearch'

await updateDocument('camera-123', {
  description: 'Updated description',
  updated_at: new Date().toISOString()
})
```

#### `deleteDocument(id: string): Promise<void>`

Removes a document from the index. Silently handles non-existent documents.

**Example:**

```typescript
import { deleteDocument } from '@/lib/elasticsearch'

await deleteDocument('camera-123')
```

#### `bulkIndexDocuments(documents: Array<{ id: string; document: ContentDocument }>): Promise<void>`

Efficiently indexes multiple documents in a single operation.

**Example:**

```typescript
import { bulkIndexDocuments } from '@/lib/elasticsearch'

await bulkIndexDocuments([
  {
    id: 'camera-1',
    document: {
      type: 'camera',
      title: 'Camera 1',
      // ... other fields
    }
  },
  {
    id: 'camera-2',
    document: {
      type: 'camera',
      title: 'Camera 2',
      // ... other fields
    }
  }
])
```

### Utility Functions

#### `ensureIndexExists(): Promise<void>`

Ensures the Elasticsearch index exists, creating it if necessary.

#### `isConfigured(): boolean`

Checks if Elasticsearch is properly configured.

**Example:**

```typescript
import { isConfigured } from '@/lib/elasticsearch'

if (isConfigured()) {
  // Perform Elasticsearch operations
}
```

## Usage Examples

### Indexing MUX Streams

```typescript
import { indexDocument } from '@/lib/elasticsearch'

async function indexMuxStream(stream: any) {
  await indexDocument(stream.id, {
    type: 'stream',
    title: stream.name || `Stream ${stream.id}`,
    description: `Live stream with playback ID: ${stream.playback_id}`,
    tags: ['mux', 'live', stream.status],
    created_at: stream.created_at,
    updated_at: new Date().toISOString(),
    metadata: {
      playback_id: stream.playback_id,
      status: stream.status,
      latency_mode: stream.latency_mode
    }
  })
}
```

### Indexing Cameras

```typescript
import { indexDocument } from '@/lib/elasticsearch'

async function indexCamera(camera: any) {
  await indexDocument(camera.id, {
    type: 'camera',
    title: camera.name,
    description: camera.description || '',
    tags: ['camera', camera.status],
    created_at: camera.created_at,
    updated_at: camera.last_connected_at || camera.updated_at,
    metadata: {
      mux_stream_id: camera.mux_stream_id,
      status: camera.status,
      location: camera.location
    }
  })
}
```

### Indexing Recordings

```typescript
import { indexDocument } from '@/lib/elasticsearch'

async function indexRecording(asset: any) {
  await indexDocument(asset.id, {
    type: 'recording',
    title: asset.name || `Recording ${asset.id}`,
    description: `Recording with playback ID: ${asset.playback_id}`,
    tags: ['recording', asset.status],
    created_at: asset.created_at,
    updated_at: asset.updated_at || asset.created_at,
    metadata: {
      playback_id: asset.playback_id,
      duration: asset.duration,
      resolution: asset.max_stored_resolution,
      status: asset.status
    }
  })
}
```

### Search with Pagination

```typescript
// Note: Current implementation returns top 20 results
// For pagination, you would need to extend the searchContent function
// to accept offset/page parameters

const results = await searchContent('security', {
  type: 'camera'
})

console.log(`Found ${results.total} results in ${results.took}ms`)
results.hits.forEach(hit => {
  console.log(`- ${hit.source.title} (score: ${hit.score})`)
})
```

## Best Practices

### 1. Always Use ISO 8601 Dates

```typescript
// Good
created_at: new Date().toISOString()

// Bad
created_at: Date.now().toString()
```

### 2. Keep Metadata Structured

```typescript
// Good
metadata: {
  location: 'Front Door',
  resolution: '1080p',
  status: 'active'
}

// Bad
metadata: {
  info: 'Front Door, 1080p, active'
}
```

### 3. Use Descriptive Titles

```typescript
// Good
title: 'Front Door Security Camera'

// Bad
title: 'Camera 1'
```

### 4. Update Documents, Don't Re-Index

```typescript
// Good - Only update what changed
await updateDocument(id, {
  status: 'inactive',
  updated_at: new Date().toISOString()
})

// Bad - Re-indexing entire document
await indexDocument(id, entireDocument)
```

### 5. Handle Errors Gracefully

```typescript
try {
  const results = await searchContent(query)
  // Handle results
} catch (error) {
  console.error('Search failed:', error)
  // Return empty results or show error to user
}
```

### 6. Use Bulk Operations for Multiple Documents

```typescript
// Good - Single request
await bulkIndexDocuments(documents)

// Bad - Multiple requests
for (const doc of documents) {
  await indexDocument(doc.id, doc.document)
}
```

### 7. Clean Up When Deleting Resources

```typescript
async function deleteCameraWithCleanup(cameraId: string) {
  // Delete from database
  await deleteFromDatabase(cameraId)
  
  // Remove from search index
  await deleteDocument(cameraId)
}
```

## Error Handling

The module handles several error scenarios automatically:

- **Index not found**: Automatically creates the index on first search
- **Document not found**: `deleteDocument` silently handles missing documents
- **Elasticsearch not configured**: All operations return early with warnings
- **Bulk operation errors**: Logged to console with details

## Logging

All operations include structured logging with the `[Elasticsearch]` prefix:

```
[Elasticsearch] Document indexed: camera-123
[Elasticsearch] Search error: Connection timeout
[Elasticsearch] Client not configured. Skipping indexing.
```

## Performance Considerations

- **Refresh strategy**: Documents use `refresh: 'wait_for'` to ensure immediate searchability
- **Bulk operations**: Preferred for indexing multiple documents
- **Search size**: Limited to 20 results by default
- **Highlighting**: Fragment size set to 150 characters with up to 3 fragments

## Future Enhancements

Potential improvements to consider:

1. **Pagination support**: Add offset/page parameters to search
2. **Aggregations**: Add support for faceted search
3. **Custom analyzers**: Language-specific text analysis
4. **Synonyms**: Improve search relevance with synonym dictionaries
5. **Autocomplete**: Add suggest/completion functionality
6. **Monitoring**: Add metrics for search performance

