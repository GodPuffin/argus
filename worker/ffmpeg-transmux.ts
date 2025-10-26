/**
 * FFmpeg HLS to MP4 Transmux
 * Fetches HLS stream and converts to MP4 with minimal re-encoding
 */

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Fetch HLS stream and transmux to MP4
 * Uses ffmpeg with codec copy when possible to minimize processing time
 */
export async function fetchAndTransmuxSegment(hlsUrl: string): Promise<Buffer> {
  // Generate temporary output file
  const tmpId = randomBytes(16).toString("hex");
  const outputPath = join(tmpdir(), `segment-${tmpId}.mp4`);

  return new Promise((resolve, reject) => {
    const ffmpegArgs = [
      // Protocol options for HLS
      "-protocol_whitelist",
      "file,http,https,tcp,tls",

      // Increase HLS timeout and retries
      "-reconnect",
      "1",
      "-reconnect_streamed",
      "1",
      "-reconnect_delay_max",
      "5",

      // HLS specific options
      "-live_start_index",
      "-1", // Read entire playlist

      // Input from HLS
      "-i",
      hlsUrl,

      // Try to copy codecs when possible (no re-encode)
      // If codec is not compatible, ffmpeg will automatically transcode
      "-c:v",
      "copy",
      "-c:a",
      "copy",

      // MP4 container
      "-f",
      "mp4",

      // Fast start for streaming
      "-movflags",
      "faststart",

      // Overwrite output
      "-y",

      outputPath,
    ];

    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

    let stderrOutput = "";

    ffmpeg.stderr.on("data", (data) => {
      stderrOutput += data.toString();
    });

    ffmpeg.on("close", async (code) => {
      if (code !== 0) {
        console.error(`FFmpeg failed with code ${code}:`);
        console.error(stderrOutput);
        reject(new Error(`FFmpeg failed with code ${code}`));
        return;
      }

      try {
        // Read the output file
        const buffer = await readFile(outputPath);

        // Clean up temporary file
        await unlink(outputPath).catch(() => {});

        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    });

    ffmpeg.on("error", (error) => {
      console.error("FFmpeg spawn error:", error);
      reject(error);
    });
  });
}
