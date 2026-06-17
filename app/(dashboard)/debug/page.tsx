"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import {
  Surface,
  SurfaceContent,
  SurfaceDescription,
  SurfaceHeader,
  SurfaceTitle,
} from "@/components/surface";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/demo/flag";

type Severity = "High" | "Medium";

interface CriticalEventPreview {
  severity: Severity;
  title: string;
  description: string;
  timestamp: string;
}

const SEVERITY_PILL_CLASS: Record<Severity, string> = {
  High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const SAMPLE_CRITICAL_EVENTS: Record<"high" | "medium", CriticalEventPreview> =
  {
    high: {
      severity: "High",
      title: "Shoplifting Incident",
      description:
        "A person wearing a blue jacket is seen taking a product from the shelf and concealing it without paying.",
      timestamp: "0:05",
    },
    medium: {
      severity: "Medium",
      title: "Suspicious Behavior",
      description:
        "Individual loitering near high-value merchandise for extended period.",
      timestamp: "2:34",
    },
  };

export default function DebugPage() {
  const router = useRouter();

  // Debug tools are not part of the public demo — redirect home.
  useEffect(() => {
    if (isDemoMode) router.replace("/watch");
  }, [router]);

  if (isDemoMode) return null;

  const showRegularToast = () => {
    toast("Regular Toast", {
      description: "This is a regular Sonner toast notification.",
    });
  };

  const showSuccessToast = () => {
    toast.success("Success Toast", {
      description: "Operation completed successfully!",
    });
  };

  const showErrorToast = () => {
    toast.error("Error Toast", {
      description: "Something went wrong. Please try again.",
    });
  };

  const showWarningToast = () => {
    toast.warning("Warning Toast", {
      description: "This action requires your attention.",
    });
  };

  const showInfoToast = () => {
    toast.info("Info Toast", {
      description: "Here's some information you should know.",
    });
  };

  const showLoadingToast = () => {
    toast.loading("Loading Toast", {
      description: "Please wait while we process your request...",
    });
  };

  const showCriticalEventToast = (event: CriticalEventPreview) => {
    toast.warning(
      <div className="flex flex-col gap-2 max-w-sm">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_PILL_CLASS[event.severity]}`}
          >
            {event.severity}
          </span>
          <div className="font-semibold">{event.title}</div>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {event.timestamp}
          </span>
          <button
            type="button"
            onClick={() => {
              toast.info("View Video clicked!", {
                description:
                  "This would navigate to the video at the specified timestamp.",
              });
            }}
            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Video
          </button>
        </div>
      </div>,
      { duration: 8000 },
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      <PageContainer>
        <PageHeader
          title="Debug Tools"
          description="Test various components and features in development."
        />

        <Surface>
          <SurfaceHeader>
            <SurfaceTitle>Sonner Toast Notifications</SurfaceTitle>
            <SurfaceDescription>
              Test different types of toast notifications
            </SurfaceDescription>
          </SurfaceHeader>
          <SurfaceContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Standard Toasts</h3>
              <div className="flex flex-wrap gap-2">
                <Button onClick={showRegularToast} variant="outline">
                  Regular Toast
                </Button>
                <Button onClick={showSuccessToast} variant="outline">
                  Success Toast
                </Button>
                <Button onClick={showErrorToast} variant="outline">
                  Error Toast
                </Button>
                <Button onClick={showWarningToast} variant="outline">
                  Warning Toast
                </Button>
                <Button onClick={showInfoToast} variant="outline">
                  Info Toast
                </Button>
                <Button onClick={showLoadingToast} variant="outline">
                  Loading Toast
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">
                Critical Event Toasts
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    showCriticalEventToast(SAMPLE_CRITICAL_EVENTS.high)
                  }
                  variant="destructive"
                >
                  Critical Event (High)
                </Button>
                <Button
                  onClick={() =>
                    showCriticalEventToast(SAMPLE_CRITICAL_EVENTS.medium)
                  }
                  variant="default"
                >
                  Critical Event (Medium)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These toasts simulate the critical event notifications with
                badge on the left of title and "View Video" button in the bottom
                right.
              </p>
            </div>
          </SurfaceContent>
        </Surface>
      </PageContainer>
    </div>
  );
}
