import { NextRequest, NextResponse } from "next/server";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

export async function DELETE(request: NextRequest) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      { error: "Mux credentials not configured" },
      { status: 500 },
    );
  }

  try {
    const { streamId } = await request.json();

    if (!streamId) {
      return NextResponse.json(
        { error: "Stream ID is required" },
        { status: 400 },
      );
    }

    // Delete the live stream via Mux API
    const response = await fetch(
      `https://api.mux.com/video/v1/live-streams/${streamId}`,
      {
        method: "DELETE",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString(
              "base64",
            ),
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mux API error:", errorData);
      return NextResponse.json(
        { error: "Failed to delete live stream", details: errorData },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Mux live stream:", error);
    return NextResponse.json(
      {
        error: "Failed to delete live stream",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
