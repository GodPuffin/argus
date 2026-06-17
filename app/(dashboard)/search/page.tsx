"use client";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Filter,
  Ghost,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SiteHeader } from "@/components/site-header";
import {
  Surface,
  SurfaceContent,
  SurfaceDescription,
  SurfaceHeader,
  SurfaceTitle,
} from "@/components/surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  AnalysisDocument,
  EventDocument,
  EventSeverity,
  EventType,
  SearchHit,
} from "@/lib/types/elasticsearch";
import { formatDuration, getThumbnailUrl } from "@/lib/types/elasticsearch";
import { cn } from "@/lib/utils";

interface SearchResponse {
  query: string;
  results: SearchHit[];
  grouped: Record<string, SearchHit[]>;
  total: number;
  took: number;
  filters: {
    doc_type: string | null;
    severity: EventSeverity[] | null;
    event_type: EventType[] | null;
    dateRange: { from: string; to: string } | null;
  };
}

const EVENT_TYPES: EventType[] = [
  "Crime",
  "Medical Emergency",
  "Traffic Incident",
  "Property Damage",
  "Safety Hazard",
  "Suspicious Activity",
  "Normal Activity",
  "Camera Interference",
];

const SEVERITIES: EventSeverity[] = ["Minor", "Medium", "High"];

interface FilterToggleBadgeProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  activeClassName?: string;
}

function FilterToggleBadge({
  label,
  active,
  onToggle,
  activeClassName,
}: FilterToggleBadgeProps) {
  return (
    <Badge
      variant={active && !activeClassName ? "default" : "outline"}
      className={cn(
        "cursor-pointer transition-colors",
        active ? activeClassName : "hover:bg-accent",
      )}
      onClick={onToggle}
    >
      {label}
    </Badge>
  );
}

interface ActiveFilterBadgeProps {
  label: string;
  onRemove: () => void;
}

function ActiveFilterBadge({ label, onRemove }: ActiveFilterBadgeProps) {
  return (
    <Badge variant="secondary" className="text-xs">
      {label}
      <button
        type="button"
        className="ml-1 inline-flex items-center rounded-sm hover:bg-accent hover:text-accent-foreground"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(
    null,
  );

  // Filters - initialize from URL params
  const [selectedSeverities, setSelectedSeverities] = useState<EventSeverity[]>(
    () => {
      const severities = searchParams.get("severity");
      return severities ? (severities.split(",") as EventSeverity[]) : [];
    },
  );
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>(
    () => {
      const types = searchParams.get("event_type");
      return types ? (types.split(",") as EventType[]) : [];
    },
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      return { from: new Date(from), to: new Date(to) };
    }
    return undefined;
  });

  // Check if any filters are active
  const hasActiveFilters =
    selectedSeverities.length > 0 ||
    selectedEventTypes.length > 0 ||
    (dateRange?.from && dateRange?.to);

  // Debounced search
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      // No query and no filters → show recent results (wildcard) instead of an
      // empty screen, so the page is always populated.
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // Only add query if it's not empty
        if (searchQuery.trim()) {
          params.append("q", searchQuery);
        } else {
          // Use wildcard search when only filters are present
          params.append("q", "*");
        }

        if (selectedSeverities.length > 0) {
          params.append("severity", selectedSeverities.join(","));
        }

        if (selectedEventTypes.length > 0) {
          params.append("event_type", selectedEventTypes.join(","));
        }

        if (dateRange?.from && dateRange?.to) {
          params.append("from", dateRange.from.toISOString());
          params.append("to", dateRange.to.toISOString());
        }

        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();

        if (response.ok) {
          setResults(data.results);
          setSearchResponse(data);
        } else {
          console.error("Search error:", data.error);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedSeverities, selectedEventTypes, dateRange],
  );

  // Debounce search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, selectedSeverities, selectedEventTypes, dateRange, handleSearch]);

  // Update URL params when search state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    if (selectedSeverities.length > 0) {
      params.set("severity", selectedSeverities.join(","));
    }

    if (selectedEventTypes.length > 0) {
      params.set("event_type", selectedEventTypes.join(","));
    }

    if (dateRange?.from && dateRange?.to) {
      params.set("from", dateRange.from.toISOString());
      params.set("to", dateRange.to.toISOString());
    }

    // Update URL without triggering navigation
    const newUrl = params.toString()
      ? `/search?${params.toString()}`
      : "/search";
    router.replace(newUrl, { scroll: false });
  }, [query, selectedSeverities, selectedEventTypes, dateRange, router]);

  const clearFilters = () => {
    setSelectedSeverities([]);
    setSelectedEventTypes([]);
    setDateRange(undefined);
  };

  const toggleSeverity = (severity: EventSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity],
    );
  };

  const toggleEventType = (eventType: EventType) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((t) => t !== eventType)
        : [...prev, eventType],
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityBadgeClass = (severity: EventSeverity) => {
    switch (severity) {
      case "High":
        return "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20 hover:bg-red-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20";
      case "Minor":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20";
      default:
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20";
    }
  };

  const handleResultClick = (hit: SearchHit) => {
    const source = hit.source;
    let timestamp = 0;

    if (source.doc_type === "event") {
      timestamp = (source as EventDocument).timestamp_seconds;
    } else if (source.doc_type === "analysis") {
      timestamp = (source as AnalysisDocument).asset_start_seconds;
    }

    router.push(`/watch/${source.asset_id}?timestamp=${timestamp}`);
  };

  // Group results by asset
  const groupedResults = new Map<string, SearchHit[]>();
  for (const hit of results) {
    const assetId = hit.source.asset_id;
    if (!groupedResults.has(assetId)) {
      groupedResults.set(assetId, []);
    }
    groupedResults.get(assetId)!.push(hit);
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <SiteHeader title="Search" />
      <ScrollArea className="flex-1 min-h-0">
        <PageContainer>
          <PageHeader
            title="Search"
            description="Query AI analysis and event documents indexed in Elasticsearch."
          />
          <Surface>
            <SurfaceHeader>
              <SurfaceTitle>Search Content</SurfaceTitle>
              <SurfaceDescription>
                Search across AI-detected events and video analysis
              </SurfaceDescription>
            </SurfaceHeader>
            <SurfaceContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for events, activities, objects..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10"
                    />
                    {loading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="relative"
                      >
                        <Filter className="h-4 w-4" />
                        {hasActiveFilters && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Filters</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <div className="px-2 py-3">
                        <div className="text-sm font-medium mb-3">Severity</div>
                        <div className="flex flex-wrap gap-2">
                          {SEVERITIES.map((severity) => (
                            <FilterToggleBadge
                              key={severity}
                              label={severity}
                              active={selectedSeverities.includes(severity)}
                              activeClassName={getSeverityBadgeClass(severity)}
                              onToggle={() => toggleSeverity(severity)}
                            />
                          ))}
                        </div>
                      </div>

                      <DropdownMenuSeparator />

                      <div className="px-2 py-3">
                        <div className="text-sm font-medium mb-3">
                          Event Type
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                          {EVENT_TYPES.map((eventType) => (
                            <FilterToggleBadge
                              key={eventType}
                              label={eventType}
                              active={selectedEventTypes.includes(eventType)}
                              onToggle={() => toggleEventType(eventType)}
                            />
                          ))}
                        </div>
                      </div>

                      <DropdownMenuSeparator />

                      <div className="px-2 py-3">
                        <div className="text-sm font-medium mb-3">
                          <CalendarIcon className="h-4 w-4 inline mr-1" />
                          Date Range
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                              className="rounded-md border"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {hasActiveFilters && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearFilters}
                              className="w-full"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Clear Filters
                            </Button>
                          </div>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeverities.map((severity) => (
                      <ActiveFilterBadge
                        key={severity}
                        label={`Severity: ${severity}`}
                        onRemove={() => toggleSeverity(severity)}
                      />
                    ))}
                    {selectedEventTypes.map((eventType) => (
                      <ActiveFilterBadge
                        key={eventType}
                        label={eventType}
                        onRemove={() => toggleEventType(eventType)}
                      />
                    ))}
                    {dateRange?.from && dateRange?.to && (
                      <ActiveFilterBadge
                        label={`${format(dateRange.from, "LLL dd, y")} to ${format(dateRange.to, "LLL dd, y")}`}
                        onRemove={() => setDateRange(undefined)}
                      />
                    )}
                  </div>
                )}
              </div>

              {searchResponse && (
                <div className="text-sm text-muted-foreground">
                  Found {searchResponse.total} results in {searchResponse.took}
                  ms
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-6">
                  {Array.from(groupedResults.entries()).map(
                    ([assetId, hits]) => {
                      const firstResult = hits[0].source;
                      const assetDate = new Date(
                        firstResult.created_at,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      const assetTime = new Date(
                        firstResult.created_at,
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const assetTitle =
                        firstResult.asset_type === "live"
                          ? firstResult.camera_name || "Live Stream"
                          : "Video";

                      const sortedHits = [...hits].sort(
                        (a, b) => b.score - a.score,
                      );
                      const displayedHits = sortedHits.slice(0, 3);
                      const remainingCount = hits.length - 3;

                      return (
                        <div key={assetId} className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            {assetTitle} - {assetDate} - {assetTime} (
                            {hits.length} result{hits.length > 1 ? "s" : ""})
                          </div>

                          <div className="space-y-3">
                            {displayedHits.map((hit) => {
                              const source = hit.source;
                              const isEvent = source.doc_type === "event";
                              const eventDoc = isEvent
                                ? (source as EventDocument)
                                : null;
                              const analysisDoc = !isEvent
                                ? (source as AnalysisDocument)
                                : null;
                              const timestamp = isEvent
                                ? eventDoc!.timestamp_seconds
                                : analysisDoc!.asset_start_seconds;

                              return (
                                <Surface
                                  key={hit.id}
                                  className="cursor-pointer transition-colors hover:bg-accent/30"
                                  onClick={() => handleResultClick(hit)}
                                >
                                  <SurfaceContent className="p-4">
                                    <div className="flex gap-4">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg mb-2">
                                          {source.title}
                                        </h3>

                                        <p className="text-sm text-muted-foreground mb-3">
                                          {isEvent
                                            ? eventDoc!.description
                                            : analysisDoc!.summary}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {isEvent && eventDoc && (
                                            <>
                                              <Badge
                                                variant="outline"
                                                className={getSeverityBadgeClass(
                                                  eventDoc.severity,
                                                )}
                                              >
                                                {eventDoc.severity}
                                              </Badge>
                                              <Badge variant="outline">
                                                {eventDoc.event_type}
                                              </Badge>
                                            </>
                                          )}

                                          {!isEvent &&
                                            analysisDoc &&
                                            analysisDoc.tags.length > 0 && (
                                              <>
                                                {analysisDoc.tags
                                                  .slice(0, 3)
                                                  .map((tag, idx) => (
                                                    <Badge
                                                      key={idx}
                                                      variant="secondary"
                                                      className="text-xs"
                                                    >
                                                      {tag}
                                                    </Badge>
                                                  ))}
                                                {analysisDoc.tags.length >
                                                  3 && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                  >
                                                    +
                                                    {analysisDoc.tags.length -
                                                      3}{" "}
                                                    more
                                                  </Badge>
                                                )}
                                              </>
                                            )}

                                          {isEvent &&
                                            eventDoc &&
                                            eventDoc.affected_entities.length >
                                              0 && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {
                                                  eventDoc.affected_entities
                                                    .length
                                                }{" "}
                                                entities
                                              </Badge>
                                            )}
                                          {!isEvent &&
                                            analysisDoc &&
                                            analysisDoc.entities.length > 0 && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {analysisDoc.entities.length}{" "}
                                                entities
                                              </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          <span>
                                            @ {formatDuration(timestamp)}
                                          </span>
                                          {source.duration && (
                                            <span>
                                              Duration:{" "}
                                              {formatDuration(source.duration)}
                                            </span>
                                          )}
                                          <span>
                                            Score: {hit.score.toFixed(2)}
                                          </span>
                                          <span>
                                            {formatDate(source.created_at)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex-shrink-0">
                                        <img
                                          src={getThumbnailUrl(
                                            source.playback_id,
                                            timestamp,
                                          )}
                                          alt={source.title}
                                          className="w-48 h-28 object-cover border border-border"
                                          onError={(e) => {
                                            // Fallback to placeholder if thumbnail fails
                                            e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='80'%3E%3Crect fill='%23ddd' width='128' height='80'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo preview%3C/text%3E%3C/svg%3E`;
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </SurfaceContent>
                                </Surface>
                              );
                            })}

                            {remainingCount > 0 && (
                              <div className="text-sm text-muted-foreground text-center py-2">
                                +{remainingCount} other
                                {remainingCount > 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}

              {!loading && query && results.length === 0 && searchResponse && (
                <div className="text-center py-12 text-muted-foreground">
                  <Ghost className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nothing found</p>
                  <p className="text-sm mt-2">No results found for "{query}"</p>
                  {hasActiveFilters && (
                    <p className="text-xs mt-2">Try adjusting your filters</p>
                  )}
                </div>
              )}
            </SurfaceContent>
          </Surface>
        </PageContainer>
      </ScrollArea>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col min-h-0">
          <SiteHeader title="Search" />
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading search...</p>
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
