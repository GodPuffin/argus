import { NextRequest, NextResponse } from "next/server";
import { searchContent } from "@/lib/elasticsearch";
import type { SearchFilters, DocumentType, EventSeverity, EventType } from "@/lib/types/elasticsearch";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const docType = searchParams.get("doc_type") as DocumentType | undefined;
    const severityParam = searchParams.get("severity");
    const eventTypeParam = searchParams.get("event_type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Validate doc_type parameter
    if (docType && !['event', 'analysis'].includes(docType)) {
      return NextResponse.json(
        { error: "Invalid doc_type. Must be 'event' or 'analysis'" },
        { status: 400 }
      );
    }

    // Build filters object
    const filters: SearchFilters = {};
    
    if (docType) {
      filters.doc_type = docType;
    }
    
    // Parse severity filter (comma-separated)
    if (severityParam) {
      const severityList = severityParam.split(',').filter(Boolean) as EventSeverity[];
      if (severityList.length > 0) {
        filters.severity = severityList;
      }
    }
    
    // Parse event_type filter (comma-separated)
    if (eventTypeParam) {
      const eventTypeList = eventTypeParam.split(',').filter(Boolean) as EventType[];
      if (eventTypeList.length > 0) {
        filters.event_type = eventTypeList;
      }
    }
    
    if (from && to) {
      filters.dateRange = { from, to };
    }

    // Perform the search
    const results = await searchContent(query.trim(), filters);

    // Group results by asset_id
    const groupedResults = new Map<string, typeof results.hits>();
    for (const hit of results.hits) {
      const assetId = hit.source.asset_id;
      if (!groupedResults.has(assetId)) {
        groupedResults.set(assetId, []);
      }
      groupedResults.get(assetId)!.push(hit);
    }

    return NextResponse.json({
      query: query.trim(),
      results: results.hits,
      grouped: Object.fromEntries(groupedResults),
      total: results.total,
      took: results.took,
      filters: {
        doc_type: docType || null,
        severity: filters.severity || null,
        event_type: filters.event_type || null,
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
