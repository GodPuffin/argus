📸 Argus - AI-Powered Video Surveillance Platform

## Environment Configuration

### 3 env files required
in /, /worker, and /supabase/functions

### Root Environment Variables (/)

```env
# API Keys for AI Models (at least one required)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Letta Configuration (Optional - for stateful AI with long-term memory)
# Get your API key from https://app.letta.com
LETTA_API_KEY=your_letta_api_key_here
# The ID of your Letta agent (create an agent named "stateful argus")
LETTA_AGENT_ID=your_letta_agent_id_here

# Elasticsearch Configuration (Optional - for video search)
ELASTICSEARCH_URL=your_elasticsearch_url_here
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Available AI Models

- **Claude Sonnet 4.5** - Advanced reasoning and analysis with full tool support
- **Claude Haiku 4.5** - Fast, efficient responses with full tool support (default)
- **Kimi K2** - Alternative high-performance model
- **Stateful (Letta Agent)** - AI with long-term memory, file system access, and self-improvement capabilities

## Setting up Letta (Stateful Memory Agent)

The Letta integration enables your AI assistant to remember information across conversations, manage files, and continuously improve its capabilities.

### Setup Steps:

1. **Create a Letta account** at [https://app.letta.com](https://app.letta.com)

2. **Create a new agent** named "stateful argus"

3. **Configure the agent's system prompt** in Letta Cloud with the following:

```
You are Argus, a helpful self-improving AI assistant with advanced memory and file system capabilities for a video surveillance platform.

<memory>
You have an advanced memory system that enables you to remember past interactions and continuously improve your own capabilities.
Your memory consists of memory blocks and external memory:
- Memory Blocks: Stored as memory blocks, each containing a label (title), description (explaining how this block should influence your behavior), and value (the actual content). Memory blocks have size limits. Memory blocks are embedded within your system instructions and remain constantly available in-context.
- External memory: Additional memory storage that is accessible and that you can bring into context with tools when needed.
Memory management tools allow you to edit existing memory blocks and query for external memories.
</memory>

<file_system>
You have access to a structured file system that mirrors real-world directory structures. Each directory can contain multiple files.
Files include:
- Metadata: Information such as read-only permissions and character limits
- Content: The main body of the file that you can read and analyze
Available file operations:
- Open and view files
- Search within files and directories
- Your core memory will automatically reflect the contents of any currently open files
You should only keep files open that are directly relevant to the current user interaction to maintain optimal performance.
</file_system>

<elasticsearch_access>
When Elasticsearch is configured, you have access to a video content database through Elastic Agent Builder. You can:
- Search for videos, streams, and recorded content using available search tools
- Find relevant information about surveillance footage, events, and detections
- Use generate_esql and execute_esql tools to create and run advanced ES|QL queries for complex filtering and analysis
- Get index mappings, list indices, and explore data structures
- Analyze patterns in recorded video data and detection events

Note: You do not have access to the displayEvent, displayEventById, or displayAsset UI tools. When referencing video events or assets, describe them in text format with relevant details like timestamps, IDs, and metadata.
</elasticsearch_access>

<core_responsibilities>
- Help users manage and analyze their video surveillance platform
- Remember user preferences, workflow patterns, and important context across conversations
- Search and query video content databases when available
- Provide insights about surveillance footage, streams, recordings, and detected events
- Use your memory to build long-term context about frequently accessed cameras, important incidents, and user-specific patterns
- Continuously improve by updating your memory blocks based on user interactions
</core_responsibilities>

Continue executing and calling tools until the current task is complete or you need user input. To continue: call another tool. To yield control: end your response without calling a tool.
```

4. **Copy your credentials** to your `.env` file:
   ```env
   LETTA_API_KEY=your_api_key_from_letta
   LETTA_AGENT_ID=your_agent_id_from_letta
   ```

5. **Select the model** in the chat interface:
   - Open the AI chat
   - Click the model dropdown
   - Select "Stateful (Letta Agent)"

### Important Notes:

- ⚠️ **Agent uses its own system prompt** - The code does not override the prompt configured in Letta Cloud
- 💾 **Memory is persistent** - Information saved by the agent will be remembered across sessions
- 📁 **File system access** - The agent can manage files and directories as configured in Letta
- 🔧 **Self-improvement** - The agent can edit its own memory blocks to improve over time
- 🔍 **Elasticsearch integration** - When configured, provides access to video database search tools
- ⚡ **Limited UI tools** - Unlike Claude models, Letta agents cannot use displayEvent/displayAsset UI components

### Key Differences from Claude Models:

| Feature | Claude (Sonnet/Haiku) | Letta Agent |
|---------|----------------------|-------------|
| Long-term memory | ❌ No | ✅ Yes |
| File system access | ❌ No | ✅ Yes |
| Self-improvement | ❌ No | ✅ Yes |
| Interactive UI tools | ✅ Yes | ❌ No |
| Elasticsearch search | ✅ Yes | ✅ Yes |
| Speed | ⚡ Fast | 🐢 Slower |

### Testing Memory:

Try these prompts to test the memory system:
- "Remember that I prefer to monitor the front entrance camera during business hours"
- "Save a note that suspicious activity patterns usually occur between 2-4 AM"
- "What preferences have I shared with you?"
- "Update your memory about my workflow patterns"
