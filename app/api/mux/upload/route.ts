import { NextResponse } from "next/server";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

export async function POST() {
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
    // Create a direct upload URL via Mux API
    const response = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64"),
      },
      body: JSON.stringify({
        cors_origin: "*", // You may want to restrict this to your domain
        new_asset_settings: {
          playback_policy: ["public"],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mux API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create upload URL", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    
    // Return the upload URL to the client
    return NextResponse.json({
      url: data.data.url,
      uploadId: data.data.id,
    });
  } catch (error) {
    console.error("Error creating Mux upload URL:", error);
    return NextResponse.json(
      {
        error: "Failed to create upload URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

