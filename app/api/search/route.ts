import { NextRequest, NextResponse } from "next/server";
import { searchContent, type ContentType, type SearchFilters } from "@/lib/elasticsearch";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") as ContentType | undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Validate type parameter
    if (type && !['stream', 'camera', 'recording'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'stream', 'camera', or 'recording'" },
        { status: 400 }
      );
    }

    // Build filters object
    const filters: SearchFilters = {};
    
    if (type) {
      filters.type = type;
    }
    
    if (from && to) {
      filters.dateRange = { from, to };
    }

    // Perform the search
    const results = await searchContent(query.trim(), filters);

    return NextResponse.json({
      query: query.trim(),
      results: results.hits,
      total: results.total,
      took: results.took,
      filters: {
        type: type || null,
        dateRange: from && to ? { from, to } : null
      }
    });

  } catch (error) {
    console.error("[Search API] Error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
