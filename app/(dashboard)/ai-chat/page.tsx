"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function NewChatPage() {
  const router = useRouter();
  const isCreatingRef = useRef(false);

  useEffect(() => {
    // Prevent race conditions with a lock pattern
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;

    const abortController = new AbortController();

    // Create a new chat and redirect to it
    fetch("/api/chat/new", { 
      method: "POST",
      signal: abortController.signal 
    })
      .then((r) => r.json())
      .then(({ id }) => {
        if (!abortController.signal.aborted) {
          router.push(`/ai-chat/${id}`);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error creating new chat:", error);
          isCreatingRef.current = false;
        }
      });

    // Cleanup function to abort ongoing request
    return () => {
      abortController.abort();
    };
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
