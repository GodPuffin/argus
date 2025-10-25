/**
 * FFmpeg Frame Extraction
 * Extracts frames from video buffers at a specified FPS
 */

import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import os from "os";

export interface VideoFrame {
  timestamp: number; // Seconds from video start
  buffer: Buffer;
}

/**
 * Extract frames from a video buffer at a specific FPS
 * @param videoBuffer - Video data as Buffer
 * @param fps - Frames per second to extract
 * @param timestampOffset - Offset to add to frame timestamps (for segments)
 * @returns Array of frames with timestamps and image buffers
 */
export async function extractFramesAtFps(
  videoBuffer: Buffer,
  fps: number,
  timestampOffset: number = 0,
): Promise<VideoFrame[]> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ffmpeg-frames-"));
  const inputPath = path.join(tempDir, "input.mp4");
  const outputPattern = path.join(tempDir, "frame-%04d.jpg");

  try {
    // Write video buffer to temp file
    await fs.writeFile(inputPath, videoBuffer);

    // Extract frames using FFmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf fps=${fps}`, // Extract at specified FPS
          "-q:v 2", // High quality JPEG (2-5 range, lower is better)
        ])
        .output(outputPattern)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    // Read extracted frames
    const files = await fs.readdir(tempDir);
    const frameFiles = files
      .filter((f) => f.startsWith("frame-") && f.endsWith(".jpg"))
      .sort();

    const frames: VideoFrame[] = [];
    for (let i = 0; i < frameFiles.length; i++) {
      const framePath = path.join(tempDir, frameFiles[i]);
      const buffer = await fs.readFile(framePath);
      const timestamp = (i / fps) + timestampOffset;
      frames.push({ timestamp, buffer });
    }

    console.log(`Extracted ${frames.length} frames at ${fps} FPS (offset: ${timestampOffset}s)`);
    return frames;
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

