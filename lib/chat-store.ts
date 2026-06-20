import type { UIMessage } from "ai";
import { generateId } from "ai";
import { isDemoMode } from "./demo/flag";
import { mockEvents } from "./demo/mock-data";
import { supabase } from "./supabase";

const NEW_CHAT = "New Chat";

/** Concatenate the text from a message's text parts (ignores tool parts etc.). */
export function extractTextFromParts(message: UIMessage): string {
  const texts: string[] = [];
  for (const part of message.parts) {
    if (part.type === "text") texts.push(part.text);
  }
  return texts.join(" ");
}

interface DemoChatRecord {
  id: string;
  title: string | null;
  messages: UIMessage[];
  updated_at: string;
}

// A pre-baked example conversation so the AI Chat history is populated in demo.
function seedDemoChats(store: Map<string, DemoChatRecord>) {
  const highEvent =
    mockEvents.find((e) => e.severity === "High") ?? mockEvents[0];
  const welcome: DemoChatRecord = {
    id: "demo-chat-welcome",
    title: "Most serious incidents this week",
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    messages: [
      {
        id: "seed-u1",
        role: "user",
        parts: [
          {
            type: "text",
            text: "What were the most serious incidents this week?",
          },
        ],
      },
      {
        id: "seed-a1",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: `This week the analysis pipeline (Roboflow detection + SAM 2 segmentation) flagged ${mockEvents.filter((e) => e.severity === "High").length} high-severity events across your cameras. The most urgent one:`,
          },
          {
            type: "tool-displayEvent",
            toolCallId: "seed-call-1",
            state: "output-available",
            input: { event_id: highEvent.id },
            output: {
              asset_id: highEvent.asset_id,
              event_id: highEvent.id,
              name: highEvent.name,
              description: highEvent.description,
              severity: highEvent.severity,
              type: highEvent.type,
              timestamp_seconds: highEvent.timestamp_seconds,
              affected_entities: highEvent.affected_entities ?? [],
            },
          },
          {
            type: "text",
            text: "Want me to compile the week's high-severity events into an incident report?",
          },
        ],
      },
      // The `tool-displayEvent` part is shaped exactly like the SDK's streamed
      // tool-output part, but `UIMessage`'s generic tool-part union isn't
      // structurally inferable from a plain object literal, so a single cast is
      // the cleanest way to seed this fixture.
    ] as UIMessage[],
  };
  store.set(welcome.id, welcome);
}

declare global {
  // eslint-disable-next-line no-var
  var __demoChatStore: Map<string, DemoChatRecord> | undefined;
}
function demoChats(): Map<string, DemoChatRecord> {
  if (!globalThis.__demoChatStore) {
    const store = new Map<string, DemoChatRecord>();
    if (isDemoMode) seedDemoChats(store);
    globalThis.__demoChatStore = store;
  }
  return globalThis.__demoChatStore;
}

/**
 * In-memory implementation of the chat store used in demo mode. Mirrors the
 * Supabase-backed code paths below; each public function branches here once.
 *
 * This state is scoped to a single warm server instance. On serverless hosts,
 * cold starts or requests routed to a different instance may fall back to the
 * seeded demo history, which is acceptable for an ephemeral public demo.
 */
const demoChatStore = {
  create(id: string): void {
    demoChats().set(id, {
      id,
      title: null,
      messages: [],
      updated_at: new Date().toISOString(),
    });
  },
  load(id: string): UIMessage[] {
    return demoChats().get(id)?.messages ?? [];
  },
  save(chatId: string, messages: UIMessage[], derivedTitle: string): void {
    const store = demoChats();
    const existing = store.get(chatId);
    store.set(chatId, {
      id: chatId,
      title: existing?.title ?? derivedTitle,
      messages,
      updated_at: new Date().toISOString(),
    });
  },
  list(
    limit: number,
  ): Array<{ id: string; title: string; updated_at: string }> {
    return Array.from(demoChats().values())
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        title: c.title ?? NEW_CHAT,
        updated_at: c.updated_at,
      }));
  },
  delete(id: string): void {
    demoChats().delete(id);
  },
};

/** Derive a chat title from the first user message, falling back to NEW_CHAT. */
function deriveTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  return firstUserMessage ? generateChatTitle(firstUserMessage) : NEW_CHAT;
}

/**
 * Create a new chat with empty messages
 */
export async function createChat(): Promise<string> {
  const id = generateId();

  if (isDemoMode) {
    demoChatStore.create(id);
    return id;
  }

  const { error } = await supabase.from("chats").insert({ id, messages: [] });

  if (error) {
    console.error("Error creating chat:", error);
    throw error;
  }

  return id;
}

/**
 * Load chat messages by ID
 */
export async function loadChat(id: string): Promise<UIMessage[]> {
  if (isDemoMode) {
    return demoChatStore.load(id);
  }

  const { data, error } = await supabase
    .from("chats")
    .select("messages")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error loading chat:", error);
    return [];
  }

  return (data?.messages as UIMessage[]) || [];
}

/**
 * Save chat messages and auto-generate title from first user message
 * Only saves if there are messages with content
 */
export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  // Don't save if no messages
  if (!messages || messages.length === 0) {
    return;
  }

  // Title to use when the chat doesn't already have one (same in both stores).
  const derivedTitle = deriveTitle(messages);

  if (isDemoMode) {
    demoChatStore.save(chatId, messages, derivedTitle);
    return;
  }

  // Auto-generate title from first user message if not already set
  const { data: existingChat } = await supabase
    .from("chats")
    .select("title")
    .eq("id", chatId)
    .single();

  const title = existingChat?.title || derivedTitle;

  const { error } = await supabase
    .from("chats")
    .update({
      messages,
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId);

  if (error) {
    console.error("Error saving chat:", error);
    throw error;
  }
}

/**
 * List recent chats for history dropdown
 */
export async function listChats(limit = 10): Promise<
  Array<{
    id: string;
    title: string;
    updated_at: string;
  }>
> {
  if (isDemoMode) {
    return demoChatStore.list(limit);
  }

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error listing chats:", error);
    return [];
  }

  return data || [];
}

/**
 * Delete a chat by ID
 */
export async function deleteChat(id: string): Promise<void> {
  if (isDemoMode) {
    demoChatStore.delete(id);
    return;
  }

  const { error } = await supabase.from("chats").delete().eq("id", id);

  if (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
}

/**
 * Generate a chat title from the first user message
 */
export function generateChatTitle(message: UIMessage): string {
  const text = extractTextFromParts(message);

  if (text.length > 50) {
    return `${text.substring(0, 50).trim()}...`;
  }

  return text || NEW_CHAT;
}
