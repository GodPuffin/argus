/**
 * API Route: Get AI analysis statistics
 * GET /api/ai-analysis/stats
 */

import { NextResponse } from "next/server";
import { getJobStats } from "@/lib/ai-analysis-queries";

export async function GET() {
  try {
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
