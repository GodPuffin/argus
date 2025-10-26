import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

// PATCH update camera name
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { cameraName } = await request.json();
    const streamId = params.id;

    if (!cameraName) {
      return NextResponse.json(
        { error: "Camera name is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .schema("mux")
      .from("live_streams")
      .update({ camera_name: cameraName })
      .eq("id", streamId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update camera name", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ camera: data });
  } catch (error) {
    console.error("Error updating camera name:", error);
    return NextResponse.json(
      {
        error: "Failed to update camera name",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE camera and its Mux stream
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      { error: "Mux credentials not configured" },
      { status: 500 },
    );
  }

  try {
    const streamId = params.id;

    // First, get the live stream
    const { data: stream, error: fetchError } = await supabase
      .schema("mux")
      .from("live_streams")
      .select("*")
      .eq("id", streamId)
      .maybeSingle();

    if (fetchError || !stream) {
      console.error("Supabase error:", fetchError);
      return NextResponse.json(
        { error: "Camera not found", details: fetchError?.message },
        { status: 404 },
      );
    }

    // Delete the Mux stream via API (webhook will handle DB deletion)
    const muxResponse = await fetch(
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

    if (!muxResponse.ok) {
      const errorData = await muxResponse.text();
      console.error("Mux API error:", errorData);
      return NextResponse.json(
        { error: "Failed to delete Mux stream", details: errorData },
        { status: 500 },
      );
    }

    // The Mux webhook will delete the record, but we can also delete directly
    // to ensure immediate removal (realtime will update all clients)
    const { error: deleteError } = await supabase
      .schema("mux")
      .from("live_streams")
      .delete()
      .eq("id", streamId);

    if (deleteError) {
      console.error("Supabase error:", deleteError);
      // Don't fail if DB delete fails - webhook will handle it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting camera:", error);
    return NextResponse.json(
      {
        error: "Failed to delete camera",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
