import { loadChat } from "@/lib/chat-store";
import ChatClient from "./chat-client";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await loadChat(id);
  
  return <ChatClient key={id} id={id} initialMessages={messages} />;
}

