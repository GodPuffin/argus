/**
 * API Route: Get AI analysis statistics
 * GET /api/ai-analysis/stats
 */

import { NextResponse } from "next/server";
import { getJobStats } from "@/lib/ai-analysis-queries";
import { isDemoMode } from "@/lib/demo/flag";
import { mockStats } from "@/lib/demo/mock-data";

export async function GET() {
  try {
    if (isDemoMode) {
      // The mock carries an extra successRate; drop it to match the leaner
      // AnalysisJobSummary shape that getJobStats() returns in prod.
      const { successRate: _successRate, ...rest } = mockStats.jobStats;
      return NextResponse.json(rest);
    }
    const stats = await getJobStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
