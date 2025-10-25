import { NextRequest, NextResponse } from "next/server";
import { syncAllData, syncAllStreams, syncAllCameras, syncAllAssets } from "@/lib/elasticsearch-sync";
import { ensureIndexExists } from "@/lib/elasticsearch";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // streams, cameras, assets, or all

    // Ensure index exists before syncing
    await ensureIndexExists();

    let results;

    switch (type) {
      case 'streams':
        const streamCount = await syncAllStreams();
        results = { streams: streamCount, cameras: 0, assets: 0 };
        break;
      
      case 'cameras':
        const cameraCount = await syncAllCameras();
        results = { streams: 0, cameras: cameraCount, assets: 0 };
        break;
      
      case 'assets':
        const assetCount = await syncAllAssets();
        results = { streams: 0, cameras: 0, assets: assetCount };
        break;
      
      case 'all':
      default:
        results = await syncAllData();
        break;
    }

    const total = results.streams + results.cameras + results.assets;

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${total} documents`,
      results
    });

  } catch (error) {
    console.error("[Sync API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

