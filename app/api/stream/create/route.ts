import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

export async function POST(request: NextRequest) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      {
        error:
          "Mux credentials not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env.local",
      },
      { status: 500 },
    );
  }

  try {
    const { browserId } = await request.json();

    if (!browserId) {
      return NextResponse.json(
        { error: "Browser ID is required" },
        { status: 400 },
      );
    }

    // Check if a live stream already exists for this browser
    const { data: existingStream, error: fetchError } = await supabase
      .schema("mux")
      .from("live_streams")
      .select("*")
      .eq("browser_id", browserId)
      .maybeSingle();

    // If stream exists, return its data
    if (existingStream && !fetchError) {
      console.log("Reusing existing stream for browser:", browserId);

      // Update last_connected_at
      await supabase
        .schema("mux")
        .from("live_streams")
        .update({ last_connected_at: new Date().toISOString() })
        .eq("browser_id", browserId);

      return NextResponse.json({
        streamKey: existingStream.stream_key,
        streamId: existingStream.id,
        playbackId: existingStream.playback_ids?.[0]?.id || null,
        cameraId: existingStream.id,
        cameraName: existingStream.camera_name,
        isExisting: true,
      });
    }

    // Create a new live stream via Mux API
    console.log("Creating new stream for browser:", browserId);
    const response = await fetch("https://api.mux.com/video/v1/live-streams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64"),
      },
      body: JSON.stringify({
        playback_policy: ["public"],
        new_asset_settings: {
          playback_policy: ["public"],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mux API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create live stream", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    const streamId = data.data.id;

    // Wait for the Mux webhook to create the live_streams record using realtime
    console.log("Waiting for webhook to sync stream:", streamId);
    
    const streamReady = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout waiting for webhook sync"));
      }, 10000); // 10 second timeout as safety net

      const channel = supabase
        .channel(`wait_for_stream_${streamId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "mux",
            table: "live_streams",
            filter: `id=eq.${streamId}`,
          },
          (payload) => {
            console.log("Stream synced via webhook:", streamId);
            cleanup();
            resolve(true);
          }
        )
        .subscribe();

      const cleanup = () => {
        clearTimeout(timeout);
        supabase.removeChannel(channel);
      };

      // Also check if it already exists (race condition)
      supabase
        .schema("mux")
        .from("live_streams")
        .select("id")
        .eq("id", streamId)
        .maybeSingle()
        .then(({ data: existing }) => {
          if (existing) {
            console.log("Stream already exists in DB:", streamId);
            cleanup();
            resolve(true);
          }
        });
    });

    // Now update the live_streams record with browser_id and camera_name
    const { data: updatedStream, error: updateError } = await supabase
      .schema("mux")
      .from("live_streams")
      .update({
        browser_id: browserId,
        camera_name: `Camera ${new Date().toLocaleDateString()}`,
        last_connected_at: new Date().toISOString(),
      })
      .eq("id", streamId)
      .select()
      .maybeSingle();

    if (updateError || !updatedStream) {
      console.error("Failed to update live stream with camera info:", updateError);
      // Fallback: return Mux data if update somehow fails
      return NextResponse.json({
        streamKey: data.data.stream_key,
        streamId: streamId,
        playbackId: data.data.playback_ids?.[0]?.id,
        status: data.data.status,
        cameraId: streamId,
        cameraName: `Camera ${new Date().toLocaleDateString()}`,
        isExisting: false,
      });
    }

    // Successfully updated - return the database data
    return NextResponse.json({
      streamKey: updatedStream.stream_key,
      streamId: updatedStream.id,
      playbackId: updatedStream.playback_ids?.[0]?.id || null,
      status: updatedStream.status,
      cameraId: updatedStream.id,
      cameraName: updatedStream.camera_name,
      isExisting: false,
    });
  } catch (error) {
    console.error("Error creating Mux live stream:", error);
    return NextResponse.json(
      {
        error: "Failed to create live stream",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
