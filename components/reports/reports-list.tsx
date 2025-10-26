"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { IconFileText, IconTrash, IconShare } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReportsListProps {
  reports: Report[];
  onDelete?: (id: string) => void;
}

export function ReportsList({ reports, onDelete }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <IconFileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold text-lg">No reports yet</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            Get started by creating your first report
          </p>
        </div>
      </div>
    );
  }

  const handleShare = (reportId: string) => {
    const url = `${window.location.origin}/reports/${reportId}`;
    navigator.clipboard.writeText(url);
    toast.success("Report link copied to clipboard");
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex flex-col rounded-lg border bg-card transition-colors hover:border-primary"
        >
          <Link href={`/reports/${report.id}`} className="block p-4">
            <div className="mb-2 flex items-start justify-between">
              <IconFileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(report.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <h3 className="mb-2 font-semibold text-lg line-clamp-1">
              {report.title}
            </h3>
            <p className="text-muted-foreground text-sm">
              Created {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </p>
          </Link>
          <div className="flex gap-2 border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(report.id)}
              className="flex-1 gap-2"
            >
              <IconShare className="h-4 w-4" />
              Share
            </Button>
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Report</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{report.title}"? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(report.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

