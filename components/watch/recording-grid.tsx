"use client";

import { useState, useRef } from "react";
import { RecordingCard } from "./recording-card";
import { type Asset } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "../ui/shadcn-io/spinner";
import * as UpChunk from "@mux/upchunk";

interface RecordingGridProps {
  assets: Asset[];
  loading: boolean;
  onUpdate?: (assetId: string, updates: { passthrough?: string; meta?: any }) => Promise<void>;
  onDelete?: (assetId: string) => Promise<void>;
}

export function RecordingGrid({ assets, loading, onUpdate, onDelete }: RecordingGridProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL from API
      const response = await fetch('/api/mux/upload', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.error || 'Failed to create upload URL');
      }

      // Create UpChunk upload
      const upload = UpChunk.createUpload({
        endpoint: data.url,
        file: file,
        chunkSize: 30720, // 30 MB
      });

      // Handle progress
      upload.on('progress', (progress) => {
        setUploadProgress(Math.round(progress.detail));
      });

      // Handle success
      upload.on('success', () => {
        setIsUploading(false);
        setUploadProgress(0);
        toast.success('Upload complete!');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });

      // Handle error
      upload.on('error', (error) => {
        setIsUploading(false);
        setUploadProgress(0);
        console.error('Upload error:', error.detail);
        toast.error('Upload failed. Please try again.');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });

    } catch (error) {
      console.error('Error initializing upload:', error);
      toast.error('Failed to start upload');
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading recordings...</div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl opacity-20">🎬</div>
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

  // Sort assets: ready first, then by creation date
  const sortedAssets = [...assets].sort((a, b) => {
    if (a.status === "ready" && b.status !== "ready") return -1;
    if (a.status !== "ready" && b.status === "ready") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
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
            />
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
              {isUploading && uploadProgress > 0 ? `${uploadProgress}%` : 'Upload'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {assets.length} total
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-4">
          {sortedAssets.map((asset) => (
            <RecordingCard 
              key={asset.id} 
              asset={asset}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

