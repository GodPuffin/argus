import { NextRequest, NextResponse } from "next/server";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

// PATCH - Update asset metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      { error: "Mux credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { passthrough, meta } = body;

    const updateData: any = {};
    if (passthrough !== undefined) updateData.passthrough = passthrough;
    if (meta !== undefined) updateData.meta = meta;

    const response = await fetch(
      `https://api.mux.com/video/v1/assets/${params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString(
              "base64"
            ),
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mux API error:", errorData);
      return NextResponse.json(
        { error: "Failed to update asset", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ asset: data.data });
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      {
        error: "Failed to update asset",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      { error: "Mux credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.mux.com/video/v1/assets/${params.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString(
              "base64"
            ),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mux API error:", errorData);
      return NextResponse.json(
        { error: "Failed to delete asset", details: errorData },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      {
        error: "Failed to delete asset",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
