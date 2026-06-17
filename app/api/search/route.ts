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

/**
 * Parse a comma-separated query param into a typed array, dropping empties.
 * Returns `[]` when the param is absent or blank.
 */
function parseCsvParam<T extends string>(value: string | null): T[] {
  if (!value) return [];
  return value.split(",").filter(Boolean) as T[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const docType = searchParams.get("doc_type") as DocumentType | undefined;
    const severityParam = searchParams.get("severity");
    const eventTypeParam = searchParams.get("event_type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    if (isDemoMode) {
      const q = query.trim().toLowerCase();
      const isWildcard = q === "*" || q === "";
      const severityList = parseCsvParam<EventSeverity>(severityParam);
      const eventTypeList = parseCsvParam<EventType>(eventTypeParam);
      const matches = mockEvents.filter((e) => {
        const textMatch =
          isWildcard ||
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q);
        const severityMatch =
          severityList.length === 0 || severityList.includes(e.severity);
        const typeMatch =
          eventTypeList.length === 0 ||
          eventTypeList.includes(e.type as EventType);
        return textMatch && severityMatch && typeMatch;
      });
      // Synthetic hits intentionally diverge from SearchHit/EventDocument:
      // playback_id/duration may be null and we add event_id/entities the real
      // index doesn't carry, so these stay structurally typed rather than cast.
      const hits = matches.map((e) => {
        const asset = mockAssets.find((a) => a.id === e.asset_id);
        const playbackId =
          (Array.isArray(asset?.playback_ids) && asset?.playback_ids[0]?.id) ||
          undefined;
        return {
          id: `event-${e.id}`,
          score: 1,
          source: {
            doc_type: "event",
            asset_id: e.asset_id,
            event_id: e.id,
            name: e.name,
            title: e.name,
            description: e.description,
            severity: e.severity,
            event_type: e.type,
            timestamp_seconds: e.timestamp_seconds,
            affected_entities: e.affected_entities ?? [],
            tags: [],
            entities: e.affected_entities ?? [],
            asset_type: "vod",
            playback_id: playbackId,
            duration: asset?.duration_seconds ?? null,
            created_at: e.created_at,
          },
        };
      });
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

    if (docType && !["event", "analysis"].includes(docType)) {
      return NextResponse.json(
        { error: "Invalid doc_type. Must be 'event' or 'analysis'" },
        { status: 400 },
      );
    }

    const filters: SearchFilters = {};

    if (docType) {
      filters.doc_type = docType;
    }

    const severityList = parseCsvParam<EventSeverity>(severityParam);
    if (severityList.length > 0) {
      filters.severity = severityList;
    }

    const eventTypeList = parseCsvParam<EventType>(eventTypeParam);
    if (eventTypeList.length > 0) {
      filters.event_type = eventTypeList;
    }

    if (from && to) {
      filters.dateRange = { from, to };
    }

    const results = await searchContent(query.trim(), filters);

    // Search results can outlive their Mux asset; drop hits whose asset has
    // since been deleted so the UI never links to missing video.
    let validatedHits = results.hits;

    if (results.hits.length > 0) {
      const assetIds = [
        ...new Set(results.hits.map((hit) => hit.source.asset_id)),
      ];

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
        // Continue with unvalidated results if the check fails.
      } else {
        const validAssetIds = new Set(existingAssets?.map((a) => a.id) || []);
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
