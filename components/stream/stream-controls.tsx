"use client";

import { IconPencil, IconVideo, IconVideoOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StreamControlsProps {
  cameraName: string;
  editingName: boolean;
  editNameValue: string;
  streaming: boolean;
  connected: boolean;
  loadingStream: boolean;
  streamError: string;
  textOverlay: string;
  cameraEnabled: boolean;
  streamKey: string;
  streamType?: "browser" | "external";
  onEditNameChange: (value: string) => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onTextOverlayChange: (value: string) => void;
  onEnableCamera: () => void;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
  onRetryStream: () => void;
}

export function StreamControls({
  cameraName,
  editingName,
  editNameValue,
  streaming,
  connected,
  loadingStream,
  streamError,
  textOverlay,
  cameraEnabled,
  streamKey,
  streamType = "browser",
  onEditNameChange,
  onSaveName,
  onCancelEdit,
  onStartEdit,
  onTextOverlayChange,
  onEnableCamera,
  onStartStreaming,
  onStopStreaming,
  onRetryStream,
}: StreamControlsProps) {
  const isBrowserStream = streamType === "browser";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {editingName ? (
            <>
              <Input
                type="text"
                value={editNameValue}
                onChange={(e) => onEditNameChange(e.target.value)}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSaveName();
                  } else if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
              />
              <Button onClick={onSaveName} size="sm">
                Save
              </Button>
              <Button onClick={onCancelEdit} variant="outline" size="sm">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <CardTitle className="flex-1">
                {cameraName || "Initializing..."}
              </CardTitle>
              {cameraName && (
                <Button
                  onClick={onStartEdit}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <IconPencil className="size-4" />
                </Button>
              )}
            </>
          )}
        </div>
        {streaming && (
          <CardDescription className="flex items-center gap-2 mt-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              {connected ? "Live" : "Disconnected"}
            </span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingStream && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Creating your stream...
          </div>
        )}

        {streamError && (
          <div className="text-sm text-destructive">
            <p>{streamError}</p>
            <Button
              onClick={onRetryStream}
              variant="link"
              className="h-auto p-0 text-xs"
            >
              Try again
            </Button>
          </div>
        )}

        {isBrowserStream && (
          <>
            <div className="space-y-2">
              <Label htmlFor="overlay">Text Overlay</Label>
              <Input
                id="overlay"
                type="text"
                value={textOverlay}
                onChange={(e) => onTextOverlayChange(e.target.value)}
                placeholder="Live from Argus!"
              />
            </div>

            {!cameraEnabled ? (
              <Button
                onClick={onEnableCamera}
                disabled={!streamKey || loadingStream}
                className="w-full"
                size="lg"
              >
                <IconVideo className="mr-2 size-5" />
                Enable Camera
              </Button>
            ) : streaming ? (
              <Button
                onClick={onStopStreaming}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <IconVideoOff className="mr-2 size-5" />
                Stop Streaming
              </Button>
            ) : (
              <Button
                onClick={onStartStreaming}
                disabled={!streamKey}
                className="w-full"
                size="lg"
              >
                <IconVideo className="mr-2 size-5" />
                Start Streaming
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
