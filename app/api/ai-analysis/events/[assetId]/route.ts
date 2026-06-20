/**
 * API Route: Get events for a specific asset
 * GET /api/ai-analysis/events/[assetId]?severity=High&type=Crime&limit=100
 */

import { NextResponse } from "next/server";
import { getEventsForAsset } from "@/lib/ai-analysis-queries";
import { isDemoMode } from "@/lib/demo/flag";
import { mockEvents } from "@/lib/demo/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  try {
    const { assetId } = await params;
    const { searchParams } = new URL(request.url);

    const severity = searchParams.get("severity") as
      | "Minor"
      | "Medium"
      | "High"
      | null;
    const type = searchParams.get("type");
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit")!, 10)
      : undefined;

    if (isDemoMode) {
      let events = mockEvents.filter((e) => e.asset_id === assetId);
      if (severity) events = events.filter((e) => e.severity === severity);
      if (type) events = events.filter((e) => e.type === type);
      if (limit) events = events.slice(0, limit);
      return NextResponse.json(events);
    }

    const events = await getEventsForAsset(assetId, {
      severity: severity || undefined,
      type: type || undefined,
      limit,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
