"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function NewChatPage() {
  const router = useRouter();
  const hasCreatedChat = useRef(false);

  useEffect(() => {
    // Prevent double creation in development mode (React Strict Mode)
    if (hasCreatedChat.current) return;
    hasCreatedChat.current = true;

    // Create a new chat and redirect to it
    fetch("/api/chat/new", { method: "POST" })
      .then((r) => r.json())
      .then(({ id }) => router.push(`/ai-chat/${id}`))
      .catch((error) => {
        console.error("Error creating new chat:", error);
      });
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center justify-center" style={{ height: "70vh" }}>
        <div className="text-center space-y-4">
          <Spinner variant="ring" size={48} className="mx-auto" />
          <p className="text-muted-foreground">Creating new chat...</p>
        </div>
      </div>
    </div>
  );
}
