/**
 * API Route: Get recent critical (high-severity) events
 * GET /api/ai-analysis/events/critical?limit=20
 */

import { NextResponse } from "next/server";
import { getCriticalEvents } from "@/lib/ai-analysis-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") 
      ? Number.parseInt(searchParams.get("limit")!, 10) 
      : 20;

    const events = await getCriticalEvents(limit);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching critical events:", error);
    return NextResponse.json(
      { error: "Failed to fetch critical events" },
      { status: 500 }
    );
  }
}

