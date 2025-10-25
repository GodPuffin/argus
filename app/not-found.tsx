"use client";

import { IconAlertCircle } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <IconAlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-6">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <a
        href="/"
        className="px-4 py-2 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
      >
        Back to Home
      </a>
    </div>
  );
}
