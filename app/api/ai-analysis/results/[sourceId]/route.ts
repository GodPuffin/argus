/**
 * API Route: Get AI analysis results for a specific source
 * GET /api/ai-analysis/results/[sourceId]
 */

import { NextResponse } from "next/server";
import { getResultsForSource } from "@/lib/ai-analysis-queries";

export async function GET(
  request: Request,
  { params }: { params: { sourceId: string } },
) {
  try {
    const { sourceId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10);

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

