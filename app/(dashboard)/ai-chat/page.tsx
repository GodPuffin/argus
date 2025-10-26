"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function NewChatPage() {
  const router = useRouter();
  const isCreatingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

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
          setError("Failed to create chat. Please try again.");
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
          {error ? (
            <>
              <p className="text-destructive text-lg font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  isCreatingRef.current = false;
                  router.refresh();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <Spinner variant="ring" size={48} className="mx-auto" />
              <p className="text-muted-foreground">Creating new chat...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
