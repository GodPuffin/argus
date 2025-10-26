import type { UIMessage } from "ai";
import { generateId } from "ai";
import { supabase } from "./supabase";

/**
 * Create a new chat with empty messages
 */
export async function createChat(): Promise<string> {
  const id = generateId();

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

  // Auto-generate title from first user message if not already set
  const { data: existingChat } = await supabase
    .from("chats")
    .select("title")
    .eq("id", chatId)
    .single();

  let title = existingChat?.title;

  // Generate title if not set
  if (!title) {
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      title = generateChatTitle(firstUserMessage);
    } else {
      title = "New Chat";
    }
  }

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
  // Extract text from message parts
  const textParts = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as any).text)
    .join(" ");

  // Truncate to 50 characters
  if (textParts.length > 50) {
    return textParts.substring(0, 50).trim() + "...";
  }

  return textParts || "New Chat";
}
