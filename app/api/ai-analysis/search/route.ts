/**
 * API Route: Search AI analysis results
 * GET /api/ai-analysis/search?tag=person&limit=50
 * GET /api/ai-analysis/search?page=0&pageSize=20
 */

import { NextResponse } from "next/server";
import { searchByTag, getRecentResults } from "@/lib/ai-analysis-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    if (tag) {
      // Search by tag
      const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
      const results = await searchByTag(tag, limit);
      return NextResponse.json(results);
    }

    // Get recent results with pagination
    const page = Number.parseInt(searchParams.get("page") || "0", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20", 10);
    const data = await getRecentResults(page, pageSize);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error searching analysis results:", error);
    return NextResponse.json(
      { error: "Failed to search results" },
      { status: 500 },
    );
  }
}

