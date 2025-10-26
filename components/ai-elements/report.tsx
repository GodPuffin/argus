"use client";

import { IconExternalLink, IconFileText } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface ReportData {
  id: string;
  title: string;
  created_at: string;
}

export function Report({ data }: { data: ReportData }) {
  const handleOpen = () => {
    window.open(`/reports/${data.id}`, "_blank");
  };

  return (
    <div className="my-4 w-full max-w-md overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <IconFileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-sm">Report Created</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-2 font-semibold text-lg">{data.title}</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Created{" "}
          {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
        </p>
        <Button onClick={handleOpen} className="w-full gap-2">
          <IconExternalLink className="h-4 w-4" />
          Open Report
        </Button>
      </div>
    </div>
  );
}
