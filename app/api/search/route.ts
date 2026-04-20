import { type NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/flag";
import { mockAssets, mockEvents } from "@/lib/demo/mock-data";
import { searchContent } from "@/lib/elasticsearch";
import { supabase } from "@/lib/supabase";
import type {
  DocumentType,
  EventSeverity,
  EventType,
  SearchFilters,
} from "@/lib/types/elasticsearch";

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
        { status: 400 },
      );
    }

    if (isDemoMode) {
      const q = query.trim().toLowerCase();
      const matches = mockEvents.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q),
      );
      const hits = matches.map((e) => ({
        score: 1,
        source: {
          doc_type: "event",
          asset_id: e.asset_id,
          event_id: e.id,
          name: e.name,
          description: e.description,
          severity: e.severity,
          event_type: e.type,
          timestamp_seconds: e.timestamp_seconds,
          created_at: e.created_at,
        },
      }));
      const grouped: Record<string, typeof hits> = {};
      for (const h of hits) {
        (grouped[h.source.asset_id] ??= []).push(h);
      }
      return NextResponse.json({
        query: query.trim(),
        results: hits,
        grouped,
        total: hits.length,
        took: 1,
        filters: {
          doc_type: docType || null,
          severity: severityParam ? severityParam.split(",") : null,
          event_type: eventTypeParam ? eventTypeParam.split(",") : null,
          dateRange: from && to ? { from, to } : null,
        },
        assets: mockAssets
          .filter((a) => grouped[a.id])
          .map((a) => ({ id: a.id, created_at: a.created_at })),
      });
    }

    // Validate doc_type parameter
    if (docType && !["event", "analysis"].includes(docType)) {
      return NextResponse.json(
        { error: "Invalid doc_type. Must be 'event' or 'analysis'" },
        { status: 400 },
      );
    }

    // Build filters object
    const filters: SearchFilters = {};

    if (docType) {
      filters.doc_type = docType;
    }

    // Parse severity filter (comma-separated)
    if (severityParam) {
      const severityList = severityParam
        .split(",")
        .filter(Boolean) as EventSeverity[];
      if (severityList.length > 0) {
        filters.severity = severityList;
      }
    }

    // Parse event_type filter (comma-separated)
    if (eventTypeParam) {
      const eventTypeList = eventTypeParam
        .split(",")
        .filter(Boolean) as EventType[];
      if (eventTypeList.length > 0) {
        filters.event_type = eventTypeList;
      }
    }

    if (from && to) {
      filters.dateRange = { from, to };
    }

    // Perform the search
    const results = await searchContent(query.trim(), filters);

    // Validate that assets still exist in mux.assets table
    let validatedHits = results.hits;

    if (results.hits.length > 0) {
      // Get unique asset IDs from search results
      const assetIds = [
        ...new Set(results.hits.map((hit) => hit.source.asset_id)),
      ];

      // Query mux.assets to check which assets still exist
      const { data: existingAssets, error: assetsError } = await supabase
        .schema("mux")
        .from("assets")
        .select("id")
        .in("id", assetIds);

      if (assetsError) {
        console.warn(
          "[Search API] Error checking assets existence:",
          assetsError,
        );
        // Continue with unvalidated results if the check fails
      } else {
        // Create a Set of valid asset IDs for fast lookup
        const validAssetIds = new Set(existingAssets?.map((a) => a.id) || []);

        // Filter results to only include those with valid assets
        const originalCount = results.hits.length;
        validatedHits = results.hits.filter((hit) =>
          validAssetIds.has(hit.source.asset_id),
        );

        if (validatedHits.length < originalCount) {
          console.log(
            `[Search API] Filtered out ${originalCount - validatedHits.length} results with missing assets`,
          );
        }
      }
    }

    // Group results by asset_id
    const groupedResults = new Map<string, typeof validatedHits>();
    for (const hit of validatedHits) {
      const assetId = hit.source.asset_id;
      if (!groupedResults.has(assetId)) {
        groupedResults.set(assetId, []);
      }
      groupedResults.get(assetId)!.push(hit);
    }

    return NextResponse.json({
      query: query.trim(),
      results: validatedHits,
      grouped: Object.fromEntries(groupedResults),
      total: validatedHits.length,
      took: results.took,
      filters: {
        doc_type: docType || null,
        severity: filters.severity || null,
        event_type: filters.event_type || null,
        dateRange: from && to ? { from, to } : null,
      },
    });
  } catch (error) {
    console.error("[Search API] Error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
