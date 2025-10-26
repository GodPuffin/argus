/**
 * API Route: Get comprehensive statistics
 * GET /api/stats?range=24h|7d|30d|all
 */

import { NextResponse } from "next/server";
import {
  getAllElasticsearchStats,
  getTimeRangeFromFilter,
} from "@/lib/elasticsearch-stats";
import { getStats } from "@/lib/stats-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range =
      (searchParams.get("range") as "24h" | "7d" | "30d" | "all") || "all";

    // Validate range parameter
    if (!["24h", "7d", "30d", "all"].includes(range)) {
      return NextResponse.json(
        { error: "Invalid range parameter. Must be one of: 24h, 7d, 30d, all" },
        { status: 400 },
      );
    }

    // Fetch both Supabase stats and Elasticsearch stats in parallel
    const timeRange = getTimeRangeFromFilter(range);

    const [stats, esMetrics] = await Promise.all([
      getStats(range),
      getAllElasticsearchStats(timeRange),
    ]);

    // Merge the data
    const combinedStats = {
      ...stats,
      esMetrics,
    };

    return NextResponse.json(combinedStats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
