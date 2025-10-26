import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all cameras (live streams with browser_id)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .schema("mux")
      .from("live_streams")
      .select("*")
      .not("browser_id", "is", null) // Only get streams that are cameras
      .order("last_connected_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch cameras", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ cameras: data || [] });
  } catch (error) {
    console.error("Error fetching cameras:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch cameras",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST update camera status or last_connected_at
// Note: Status updates from Mux webhooks will override this, which is correct behavior
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { browserId, status, lastConnectedAt } = body;

    if (!browserId) {
      return NextResponse.json(
        { error: "Browser ID is required" },
        { status: 400 },
      );
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (lastConnectedAt) updates.last_connected_at = lastConnectedAt;

    const { data, error } = await supabase
      .schema("mux")
      .from("live_streams")
      .update(updates)
      .eq("browser_id", browserId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update camera", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ camera: data });
  } catch (error) {
    console.error("Error updating camera:", error);
    return NextResponse.json(
      {
        error: "Failed to update camera",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
