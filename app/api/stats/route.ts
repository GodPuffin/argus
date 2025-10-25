/**
 * API Route: Get comprehensive statistics
 * GET /api/stats?range=24h|7d|30d|all
 */

import { NextResponse } from "next/server";
import { getStats } from "@/lib/stats-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") as '24h' | '7d' | '30d' | 'all' || 'all';
    
    // Validate range parameter
    if (!['24h', '7d', '30d', 'all'].includes(range)) {
      return NextResponse.json(
        { error: "Invalid range parameter. Must be one of: 24h, 7d, 30d, all" },
        { status: 400 }
      );
    }
    
    const stats = await getStats(range);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

