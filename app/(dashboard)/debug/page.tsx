"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DebugPage() {
  const router = useRouter();

  const showRegularToast = () => {
    toast("Regular Toast", {
      description: "This is a regular Sonner toast notification with JetBrains Mono font.",
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

  const showCriticalEventToast = () => {
    toast.warning(
      <div className="flex flex-col gap-2 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            High
          </span>
          <div className="font-semibold">Shoplifting Incident</div>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">
          A person wearing a blue jacket is seen taking a product from the shelf and concealing it without paying.
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            0:05
          </span>
          <button
            onClick={() => {
              toast.info("View Video clicked!", {
                description: "This would navigate to the video at the specified timestamp.",
              });
            }}
            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Video
          </button>
        </div>
      </div>,
      {
        duration: 8000,
      }
    );
  };

  const showCriticalEventMediumSeverity = () => {
    toast.warning(
      <div className="flex flex-col gap-2 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Medium
          </span>
          <div className="font-semibold">Suspicious Behavior</div>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">
          Individual loitering near high-value merchandise for extended period.
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            2:34
          </span>
          <button
            onClick={() => {
              toast.info("View Video clicked!", {
                description: "This would navigate to the video at the specified timestamp.",
              });
            }}
            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Video
          </button>
        </div>
      </div>,
      {
        duration: 8000,
      }
    );
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Debug Tools</h1>
          <p className="text-muted-foreground">
            Test various components and features in development
          </p>
        </div>

        {/* Sonner Toast Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Sonner Toast Notifications</CardTitle>
            <CardDescription>
              Test different types of toast notifications with JetBrains Mono font
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <h3 className="text-sm font-semibold mb-3">Critical Event Toasts</h3>
              <div className="flex flex-wrap gap-2">
                <Button onClick={showCriticalEventToast} variant="destructive">
                  Critical Event (High)
                </Button>
                <Button onClick={showCriticalEventMediumSeverity} variant="default">
                  Critical Event (Medium)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These toasts simulate the critical event notifications with badge on the left of title
                and "View Video" button in the bottom right.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for future debug tools */}
        <Card>
          <CardHeader>
            <CardTitle>More Debug Tools</CardTitle>
            <CardDescription>
              Additional debugging utilities will be added here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              More debug tools coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

