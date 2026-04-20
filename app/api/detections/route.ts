import { type NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/flag";
import { getMockDetectionsForAsset } from "@/lib/demo/mock-data";
import { getDetectionsForSource } from "@/lib/detection-queries";

/**
 * GET /api/detections
 * Fetch object detections for a video source
 *
 * Query params:
 * - sourceId: Asset ID (required)
 * - startTime: Start time in seconds (optional)
 * - endTime: End time in seconds (optional)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sourceId = searchParams.get("sourceId");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!sourceId) {
    return NextResponse.json(
      { error: "sourceId is required" },
      { status: 400 },
    );
  }

  if (isDemoMode) {
    const start = startTime ? Number.parseFloat(startTime) : undefined;
    const end = endTime ? Number.parseFloat(endTime) : undefined;
    const frames = getMockDetectionsForAsset(sourceId).filter((f) => {
      if (start !== undefined && f.frame_timestamp < start) return false;
      if (end !== undefined && f.frame_timestamp > end) return false;
      return true;
    });
    return NextResponse.json({ detections: frames });
  }

  try {
    const detections = await getDetectionsForSource(
      sourceId,
      startTime ? parseFloat(startTime) : undefined,
      endTime ? parseFloat(endTime) : undefined,
    );

    return NextResponse.json({ detections });
  } catch (error) {
    console.error("Error fetching detections:", error);
    return NextResponse.json(
      { error: "Failed to fetch detections" },
      { status: 500 },
    );
  }
}
