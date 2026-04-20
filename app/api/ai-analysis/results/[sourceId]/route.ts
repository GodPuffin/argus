/**
 * API Route: Get AI analysis results for a specific source
 * GET /api/ai-analysis/results/[sourceId]
 */

import { NextResponse } from "next/server";
import { getResultsForSource } from "@/lib/ai-analysis-queries";
import { isDemoMode } from "@/lib/demo/flag";
import {
  mockAnalysisJobs,
  mockAnalysisResults,
} from "@/lib/demo/mock-data";

export async function GET(
  request: Request,
  { params }: { params: { sourceId: string } },
) {
  try {
    const { sourceId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10);

    if (isDemoMode) {
      const jobIds = new Set(
        mockAnalysisJobs
          .filter((j) => j.source_id === sourceId)
          .map((j) => j.id),
      );
      const results = mockAnalysisResults
        .filter((r) => jobIds.has(r.job_id))
        .slice(0, limit);
      return NextResponse.json(results);
    }

    const results = await getResultsForSource(sourceId, limit);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching analysis results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 },
    );
  }
}
