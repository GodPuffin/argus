"use client";

import { IconLoader2, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CtaLink } from "@/components/cta-link";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { ReportsList } from "@/components/reports/reports-list";
import { SiteHeader } from "@/components/site-header";
import { useReportsRealtime } from "@/hooks/use-reports-realtime";

export default function ReportsPage() {
  const { reports, loading, error } = useReportsRealtime();
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateReport = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Report",
        }),
      });

      if (!response.ok) throw new Error("Failed to create report");

      const { report } = await response.json();
      toast.success("Report created");
      router.push(`/reports/${report.id}`);
    } catch (err) {
      console.error("Error creating report:", err);
      toast.error("Failed to create report");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete report");

      toast.success("Report deleted");
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Failed to delete report");
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SiteHeader title="Reports" />

      <div className="flex-1 overflow-y-auto">
        <PageContainer>
          <PageHeader
            title="Your Reports"
            description="Create and manage your documentation and reports."
            actions={
              <CtaLink onClick={handleCreateReport} disabled={creating}>
                {creating ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconPlus className="h-4 w-4" />
                    New Report
                  </>
                )}
              </CtaLink>
            }
          />

          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="border border-destructive bg-destructive/10 p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          ) : (
            <ReportsList reports={reports} onDelete={handleDeleteReport} />
          )}
        </PageContainer>
      </div>
    </div>
  );
}
