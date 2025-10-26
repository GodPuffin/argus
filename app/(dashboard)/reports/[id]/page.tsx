"use client";

import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ReportDropdown } from "@/components/reports/report-dropdown";
import { TiptapEditor } from "@/components/reports/tiptap-editor";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useReportsRealtime } from "@/hooks/use-reports-realtime";
import type { Report } from "@/lib/supabase";

export default function ReportEditorPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const { reports, loading: reportsLoading } = useReportsRealtime();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Debounce content updates
  const debouncedContent = useDebounce(content, 1000);

  // Fetch the specific report
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${reportId}`);
        if (!response.ok) throw new Error("Report not found");

        const { report: fetchedReport } = await response.json();
        setReport(fetchedReport);
        setTitle(fetchedReport.title);
        setContent(fetchedReport.content);
        setError(null);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  // Auto-save content changes
  useEffect(() => {
    if (!debouncedContent || !report) return;

    const saveContent = async () => {
      setSaving(true);
      try {
        const response = await fetch(`/api/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: debouncedContent }),
        });

        if (!response.ok) throw new Error("Failed to save");
      } catch (err) {
        console.error("Error saving content:", err);
        toast.error("Failed to save changes");
      } finally {
        setSaving(false);
      }
    };

    saveContent();
  }, [debouncedContent, reportId, report]);

  // Save title changes
  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) throw new Error("Failed to update title");
    } catch (err) {
      console.error("Error updating title:", err);
      toast.error("Failed to update title");
    }
  };

  const handleCreateNew = async () => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Report" }),
      });

      if (!response.ok) throw new Error("Failed to create report");

      const { report: newReport } = await response.json();
      router.push(`/reports/${newReport.id}`);
      toast.success("Report created");
    } catch (err) {
      console.error("Error creating report:", err);
      toast.error("Failed to create report");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <SiteHeader title="Reports" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <IconAlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 font-semibold text-2xl">Report Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              {error || "The report you're looking for doesn't exist"}
            </p>
            <Button onClick={() => router.push("/reports")} className="mt-4">
              Back to Reports
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SiteHeader title="Reports">
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-muted-foreground text-xs">Saving...</span>
          )}
          <ReportDropdown
            currentReport={report}
            allReports={reports}
            onCreateNew={handleCreateNew}
          />
        </div>
      </SiteHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl p-6">
          <div className="mb-6">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="border-none text-3xl font-bold focus-visible:ring-0"
              placeholder="Report Title"
            />
          </div>
          <TiptapEditor content={content} onUpdate={setContent} />
        </div>
      </div>
    </div>
  );
}
