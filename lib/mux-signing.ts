/**
 * Mux Playback JWT Signing
 * Creates signed tokens with instant clipping claims for secure playback
 */

import { createHmac } from "node:crypto";

export interface ClipClaims {
  // VOD clipping (relative times in seconds)
  asset_start_time?: number;
  asset_end_time?: number;
  // Live clipping (absolute epoch timestamps)
  program_start_time?: number;
  program_end_time?: number;
  // Thumbnail program time (absolute epoch)
  program_time?: number;
}

export interface PlaybackTokenOptions {
  playbackId: string;
  type: "video" | "thumbnail" | "storyboard";
  keyId: string;
  keySecret: string;
  expiration?: string; // e.g., "1h", "30m" - defaults to 1 hour
  clips?: ClipClaims;
}

/**
 * Parse expiration string to seconds
 * Supports: "1h", "30m", "1d"
 */
function parseExpiration(exp: string): number {
  const match = exp.match(/^(\d+)([hmd])$/);
  if (!match) {
    throw new Error(`Invalid expiration format: ${exp}`);
  }
  const [, value, unit] = match;
  const num = Number.parseInt(value, 10);
  switch (unit) {
    case "h":
      return num * 3600;
    case "m":
      return num * 60;
    case "d":
      return num * 86400;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Base64url encoding (RFC 4648)
 */
function base64url(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Create a Mux playback JWT with optional instant clipping claims
 * Reference: https://docs.mux.com/guides/secure-video-playback
 */
export function signMuxPlaybackToken(options: PlaybackTokenOptions): string {
  const {
    playbackId,
    type,
    keyId,
    keySecret,
    expiration = "1h",
    clips = {},
  } = options;

  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseExpiration(expiration);

  // Build base claims
  const claims: Record<string, any> = {
    sub: playbackId,
    aud: type,
    exp,
    kid: keyId,
  };

  // Add clipping claims if provided
  if (clips.asset_start_time !== undefined) {
    claims.asset_start_time = clips.asset_start_time;
  }
  if (clips.asset_end_time !== undefined) {
    claims.asset_end_time = clips.asset_end_time;
  }
  if (clips.program_start_time !== undefined) {
    claims.program_start_time = clips.program_start_time;
  }
  if (clips.program_end_time !== undefined) {
    claims.program_end_time = clips.program_end_time;
  }
  if (clips.program_time !== undefined) {
    claims.program_time = clips.program_time;
  }

  // Build JWT header
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const headerEncoded = base64url(JSON.stringify(header));
  const payloadEncoded = base64url(JSON.stringify(claims));
  const message = `${headerEncoded}.${payloadEncoded}`;

  // Sign with HMAC SHA256
  const signature = createHmac("sha256", Buffer.from(keySecret, "base64"))
    .update(message)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${message}.${signature}`;
}

/**
 * Build a signed Mux playback URL for a video segment
 */
export function buildSignedPlaybackUrl(
  playbackId: string,
  keyId: string,
  keySecret: string,
  clips: ClipClaims,
  expiration = "1h",
): string {
  const token = signMuxPlaybackToken({
    playbackId,
    type: "video",
    keyId,
    keySecret,
    expiration,
    clips,
  });
  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

/**
 * Build a signed thumbnail URL with program_time
 */
export function buildSignedThumbnailUrl(
  playbackId: string,
  keyId: string,
  keySecret: string,
  programTime: number,
  expiration = "1h",
): string {
  const token = signMuxPlaybackToken({
    playbackId,
    type: "thumbnail",
    keyId,
    keySecret,
    expiration,
    clips: { program_time: programTime },
  });
  return `https://image.mux.com/${playbackId}/thumbnail.png?token=${token}`;
}

/**
 * Build a signed storyboard URL with clipping claims
 */
export function buildSignedStoryboardUrl(
  playbackId: string,
  keyId: string,
  keySecret: string,
  clips: ClipClaims,
  expiration = "1h",
): string {
  const token = signMuxPlaybackToken({
    playbackId,
    type: "storyboard",
    keyId,
    keySecret,
    expiration,
    clips,
  });
  return `https://image.mux.com/${playbackId}/storyboard.vtt?token=${token}`;
}

