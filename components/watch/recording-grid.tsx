"use client";

import * as UpChunk from "@mux/upchunk";
import { Ghost, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Asset } from "@/lib/supabase";
import type { SearchHit } from "@/lib/types/elasticsearch";
import { Spinner } from "../ui/shadcn-io/spinner";
import { RecordingCard } from "./recording-card";

interface RecordingGridProps {
  assets: Asset[];
  loading: boolean;
  onUpdate?: (
    assetId: string,
    updates: { passthrough?: string; meta?: any },
  ) => Promise<void>;
  onDelete?: (assetId: string) => Promise<void>;
}

export function RecordingGrid({
  assets,
  loading,
  onUpdate,
  onDelete,
}: RecordingGridProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced search handler
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams();
      params.append("q", query);

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Get only 1 result per asset_id using the highest score
        const assetMap = new Map<string, SearchHit>();

        for (const hit of data.results) {
          const assetId = hit.source.asset_id;
          const existingHit = assetMap.get(assetId);

          // Keep the highest scoring result for each asset
          if (!existingHit || hit.score > existingHit.score) {
            assetMap.set(assetId, hit);
          }
        }

        // Convert map to array and sort by score descending
        const uniqueResults = Array.from(assetMap.values()).sort(
          (a, b) => b.score - a.score,
        );

        setSearchResults(uniqueResults);
      } else {
        console.error("Search error:", data.error);
        setSearchError("Search failed. Please try again.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL from API
      const response = await fetch("/api/mux/upload", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(data.error || "Failed to create upload URL");
      }

      // Create UpChunk upload
      const upload = UpChunk.createUpload({
        endpoint: data.url,
        file: file,
        chunkSize: 30720, // 30 MB
      });

      // Handle progress
      upload.on("progress", (progress) => {
        setUploadProgress(Math.round(progress.detail));
      });

      // Handle success
      upload.on("success", () => {
        setIsUploading(false);
        setUploadProgress(0);
        toast.success("Upload complete!");
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });

      // Handle error
      upload.on("error", (error) => {
        setIsUploading(false);
        setUploadProgress(0);
        console.error("Upload error:", error.detail);
        toast.error("Upload failed. Please try again.");
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
    } catch (error) {
      console.error("Error initializing upload:", error);
      toast.error("Failed to start upload");
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading recordings...
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Ghost className="h-24 w-24 mx-auto mb-4 opacity-20" />
        <div>
          <h3 className="text-lg font-semibold mb-2">No recordings found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start streaming on the{" "}
            <a href="/stream" className="text-primary hover:underline">
              Stream page
            </a>{" "}
            to create recordings
          </p>
        </div>
      </div>
    );
  }

  // Determine which assets to display
  let displayAssets: Asset[] = [];

  // Only show search results if we're actively searching or have completed a search
  // This prevents showing empty results during the debounce period
  const showSearchResults =
    searchQuery.trim() && (isSearching || searchResults.length > 0);

  if (showSearchResults) {
    // Map search results to assets
    displayAssets = searchResults
      .map((hit) => assets.find((asset) => asset.id === hit.source.asset_id))
      .filter((asset): asset is Asset => asset !== undefined);
  } else {
    // Sort assets: ready first, then by creation date
    displayAssets = [...assets].sort((a, b) => {
      if (a.status === "ready" && b.status !== "ready") return -1;
      if (a.status !== "ready" && b.status === "ready") return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Your Recordings</h2>
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recordings..."
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* Upload Button */}
            <Button
              type="button"
              variant="default"
              size="sm"
              className="gap-2"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Spinner size={16} />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading && uploadProgress > 0
                ? `${uploadProgress}%`
                : "Upload"}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {showSearchResults
              ? `${displayAssets.length} result${displayAssets.length !== 1 ? "s" : ""}`
              : `${assets.length} total`}
          </p>
          {searchError && <p className="text-sm text-red-500">{searchError}</p>}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {isSearching ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Searching recordings...
            </div>
          </div>
        ) : displayAssets.length === 0 && showSearchResults ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ghost className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No recordings found</p>
            <p className="text-sm mt-2">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-4">
            {displayAssets.map((asset) => (
              <RecordingCard
                key={asset.id}
                asset={asset}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
