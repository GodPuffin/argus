import { NextRequest, NextResponse } from "next/server";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

export async function GET(request: NextRequest) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      { error: "Mux credentials not configured" },
      { status: 500 },
    );
  }

  try {
    // Get status filter from query params (optional)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, idle, or disabled

    // Build URL with optional status filter
    let url = "https://api.mux.com/video/v1/live-streams?limit=25";
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64"),
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mux API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch live streams", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Transform the data to return what we need
    const streams = data.data.map((stream: any) => ({
      id: stream.id,
      streamKey: stream.stream_key,
      status: stream.status,
      playbackId: stream.playback_ids?.[0]?.id,
      createdAt: stream.created_at,
      recentAssetIds: stream.recent_asset_ids || [],
      reconnectWindow: stream.reconnect_window,
      latencyMode: stream.latency_mode,
    }));

    return NextResponse.json({ streams });
  } catch (error) {
    console.error("Error fetching live streams:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live streams",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
