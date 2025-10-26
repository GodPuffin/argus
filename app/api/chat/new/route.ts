import { createChat } from "@/lib/chat-store";

export async function POST() {
  try {
    const id = await createChat();
    return Response.json({ id });
  } catch (error) {
    console.error("Error creating new chat:", error);
    return Response.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
