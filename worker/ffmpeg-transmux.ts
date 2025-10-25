/**
 * FFmpeg HLS to MP4 Transmux
 * Fetches HLS stream and converts to MP4 with minimal re-encoding
 */

import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { unlink, readFile } from "node:fs/promises";

/**
 * Fetch HLS stream and transmux to MP4
 * Uses ffmpeg with codec copy when possible to minimize processing time
 */
export async function fetchAndTransmuxSegment(
  hlsUrl: string,
): Promise<Buffer> {
  // Generate temporary output file
  const tmpId = randomBytes(16).toString("hex");
  const outputPath = join(tmpdir(), `segment-${tmpId}.mp4`);

  return new Promise((resolve, reject) => {
    const ffmpegArgs = [
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

    console.log(`Running ffmpeg: ${ffmpegArgs.join(" ")}`);

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
        await unlink(outputPath).catch((err) =>
          console.warn(`Failed to delete temp file ${outputPath}:`, err),
        );

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

