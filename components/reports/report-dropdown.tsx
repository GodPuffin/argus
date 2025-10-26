"use client";

import {
  IconChevronDown,
  IconFileText,
  IconHome,
  IconPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Report } from "@/lib/supabase";

interface ReportDropdownProps {
  currentReport: Report;
  allReports: Report[];
  onCreateNew?: () => void;
}

export function ReportDropdown({
  currentReport,
  allReports,
  onCreateNew,
}: ReportDropdownProps) {
  const router = useRouter();

  const handleSelectReport = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <IconFileText className="h-4 w-4" />
          <span className="max-w-[200px] truncate">{currentReport.title}</span>
          <IconChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel>Reports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/reports")}>
          <IconHome className="mr-2 h-4 w-4" />
          <span>Reports Home</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {allReports.map((report) => (
            <DropdownMenuItem
              key={report.id}
              onClick={() => handleSelectReport(report.id)}
              className={report.id === currentReport.id ? "bg-accent" : ""}
            >
              <IconFileText className="mr-2 h-4 w-4" />
              <span className="flex-1 truncate">{report.title}</span>
            </DropdownMenuItem>
          ))}
        </div>
        {onCreateNew && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateNew}>
              <IconPlus className="mr-2 h-4 w-4" />
              <span>Create New Report</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
