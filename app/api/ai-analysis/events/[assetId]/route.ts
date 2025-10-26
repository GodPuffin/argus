/**
 * API Route: Get events for a specific asset
 * GET /api/ai-analysis/events/[assetId]?severity=High&type=Crime&limit=100
 */

import { NextResponse } from "next/server";
import { getEventsForAsset } from "@/lib/ai-analysis-queries";

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
