# Argus

Video surveillance and analysis platform with AI-powered features.

## Features

- **Watch**: Monitor live camera streams and recordings
- **Stats**: View analytics and statistics
- **Search**: Search through video content
- **AI Chat**: Interact with AI to query your video database
- **Reports**: Create and manage documentation using Tiptap editor

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider API Keys (at least one required)
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
```

### Optional

```env
# Elasticsearch Configuration
ELASTICSEARCH_URL=your_elasticsearch_url
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key

# Tiptap Cloud Configuration (for Reports feature)
# Sign up at https://cloud.tiptap.dev/
TIPTAP_DOCUMENT_SERVER_ID=your_document_server_id
TIPTAP_APP_SECRET=your_app_secret
TIPTAP_DOCUMENT_MANAGEMENT_API_SECRET=your_document_management_api_secret
```

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (see above)

3. Run database migrations:
```bash
# Migrations are in supabase/migrations/
# Apply them using Supabase CLI or dashboard
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Reports Feature

The Reports feature allows you to create and manage rich-text documents using Tiptap editor.

### Creating Reports

- Navigate to **Reports** from the sidebar
- Click **New Report** to create a document
- Use the dropdown in the header to switch between reports

### Markdown Support

You can create reports programmatically with markdown:

```javascript
// POST /api/reports
{
  "title": "My Report",
  "markdown": "# Heading\n\nContent here..."
}
```

This enables AI-generated reports in the future.

## Tech Stack

- Next.js 15
- React 19
- Supabase
- Tiptap Editor
- Tailwind CSS
- TypeScript
