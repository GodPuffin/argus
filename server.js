const http = require("http");
const https = require("https");
const { parse } = require("url");
const next = require("next");
const { Server: WebSocketServer } = require("ws");
const child_process = require("child_process");
const url = require("url");
const fs = require("fs");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = "localhost";
const dev = process.env.NODE_ENV !== "production";

// Initialize Next.js - simpler initialization per Next.js docs
const app = next({ dev });
const handle = app.getRequestHandler();

// HTTPS configuration (optional)
const cert = process.env.CERT_FILE
  ? fs.readFileSync(process.env.CERT_FILE)
  : undefined;
const key = process.env.KEY_FILE
  ? fs.readFileSync(process.env.KEY_FILE)
  : undefined;
const transcode = process.env.SMART_TRANSCODE !== "false";
const httpsOptions = cert && key ? { cert, key } : null;

app.prepare().then(() => {
  // Create HTTP or HTTPS server
  const server = httpsOptions
    ? https.createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      })
    : http.createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      });

  // Start server
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(
      `> Server listening at http${httpsOptions ? "s" : ""}://${hostname}:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`,
    );
  });

  const wss = new WebSocketServer({
    noServer: true,
  });

  // Track active connections
  let connectionCount = 0;
  const activeConnections = new Map();

  // Handle WebSocket upgrade requests
  server.on("upgrade", (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    // Only handle our custom streaming WebSocket at /rtmp
    // Let Next.js handle all other WebSocket connections (including HMR)
    if (pathname === "/rtmp") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // Don't destroy the socket - let Next.js handle other paths
  });

  wss.on("connection", (ws, req) => {
    const connectionId = ++connectionCount;
    console.log(`\n[Stream #${connectionId}] New connection established`);
    console.log(
      `[Stream #${connectionId}] Total active streams: ${activeConnections.size + 1}`,
    );

    ws.send(JSON.stringify({ type: "connected", connectionId }));

    const queryString = url.parse(req.url).search;
    const params = new URLSearchParams(queryString);
    const baseUrl = params.get("url") ?? "rtmps://global-live.mux.com:443/app";
    const key = params.get("key");
    const format = params.get("format") ?? "webm"; // mp4 or webm
    const video = params.get("video");
    const audio = params.get("audio");

    console.log(
      `[Stream #${connectionId}] Config: format=${format}, video=${video}, audio=${audio}`,
    );
    console.log(
      `[Stream #${connectionId}] Stream key: ${key?.substring(0, 8)}...`,
    );

    const rtmpUrl = `${baseUrl}/${key}`;

    const videoCodec =
      video === "h264" && transcode
        ? ["-c:v", "copy"]
        : // video codec config: low latency, adaptive bitrate
          [
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-tune",
            "zerolatency",
            "-threads",
            "0",
          ];

    // Always transcode audio to AAC for RTMP/FLV compatibility
    // Chrome's MP4 MediaRecorder sends Opus (not AAC), Firefox sends Opus
    // RTMP/FLV only supports AAC, MP3, Speex
    const audioCodec = ["-c:a", "aac", "-ar", "44100", "-b:a", "64k"];

    // Build FFmpeg arguments based on format
    const inputFormat = format === "mp4" ? "mp4" : "webm";

    const ffmpegArgs = [
      // Verbose mode for debugging
      "-loglevel",
      "info",

      // Force input format
      "-f",
      inputFormat,

      // Re-timestamp and sync - input flags
      "-fflags",
      "+genpts+igndts",
      "-avoid_negative_ts",
      "make_zero",

      // Input from stdin
      "-i",
      "pipe:0",

      // force to overwrite
      "-y",

      // Audio sync
      "-async",
      "1",

      ...videoCodec,
      ...audioCodec,

      // RTMP specific flags for stable streaming
      "-bufsize",
      "3000k",
      "-maxrate",
      "3000k",
      "-g",
      "60", // keyframe every 2 seconds at 30fps
      "-sc_threshold",
      "0",
      "-f",
      "flv",
      "-flvflags",
      "no_duration_filesize",

      rtmpUrl,
    ];

    console.log(`[Stream #${connectionId}] Starting FFmpeg...`);
    const ffmpeg = child_process.spawn("ffmpeg", ffmpegArgs);

    let ffmpegReady = false;
    let bytesReceived = 0;

    // Store connection info
    activeConnections.set(connectionId, {
      ws,
      ffmpeg,
      key,
      startTime: Date.now(),
      bytesReceived: 0,
    });

    // Kill the WebSocket connection if ffmpeg dies.
    ffmpeg.on("close", (code, signal) => {
      // Error code 4294957242 (unsigned) = -10054 (signed) = WSAECONNRESET on Windows
      // This is normal when Mux closes the connection during shutdown
      const isExpectedShutdown = 
        code === 0 || 
        code === 255 || 
        code === 4294957242 || // Windows WSAECONNRESET
        code === 3753488571;   // Other EOF errors
      
      const status = isExpectedShutdown ? "✓" : "✗";
      console.log(
        `[Stream #${connectionId}] ${status} FFmpeg closed. Code: ${code}, Signal: ${signal}, Bytes: ${Math.floor(bytesReceived / 1024)}KB`,
      );
      
      if (!isExpectedShutdown) {
        console.warn(
          `[Stream #${connectionId}] Unexpected exit code. This may indicate an issue.`,
        );
      }
      
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          type: "ffmpeg_closed", 
          code, 
          signal,
          expected: isExpectedShutdown 
        }));
      }
      activeConnections.delete(connectionId);
      console.log(
        `[Stream #${connectionId}] Removed. Active streams: ${activeConnections.size}`,
      );
      ws.terminate();
    });

    ffmpeg.on("error", (error) => {
      console.error(`[Stream #${connectionId}] FFmpeg error:`, error.message);
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({ type: "error", message: "FFmpeg process error" }),
        );
      }
    });

    // Handle STDIN pipe errors by logging to the console.
    // These errors most commonly occur when FFmpeg closes and there is still
    // data to write. If left unhandled, the server will crash.
    ffmpeg.stdin.on("error", (e) => {
      console.error(`[Stream #${connectionId}] FFmpeg STDIN Error:`, e.message);
    });

    // FFmpeg outputs all of its messages to STDERR. Let's log them to the console.
    let stderrBuffer = "";
    let isShuttingDown = false;
    
    ffmpeg.stderr.on("data", (data) => {
      const text = data.toString();
      stderrBuffer += text;

      // Check if FFmpeg is ready (has started processing)
      if (!ffmpegReady && text.includes("Output #0")) {
        ffmpegReady = true;
        console.log(
          `[Stream #${connectionId}] ✓ FFmpeg started streaming to Mux!`,
        );
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "streaming_started" }));
        }
      }

      // Log important messages
      if (
        text.includes("Input #0") ||
        text.includes("Output #0") ||
        text.includes("Stream #") ||
        text.includes("Video:") ||
        text.includes("Audio:")
      ) {
        console.log(`[Stream #${connectionId}] FFmpeg:`, text.trim());
      }

      // Detect common shutdown errors (these are expected when Mux closes the stream)
      const isShutdownError = 
        text.includes("Error number -10054") || // Windows WSAECONNRESET
        text.includes("End of file") ||
        text.includes("Connection reset") ||
        text.includes("Broken pipe");

      // Log errors and warnings (but suppress expected shutdown errors)
      if (
        text.includes("error") ||
        text.includes("Error") ||
        text.includes("warning") ||
        text.includes("Warning")
      ) {
        if (isShutdownError && (isShuttingDown || ws.readyState !== ws.OPEN)) {
          // Suppress expected shutdown errors - just log at debug level
          if (text.includes("Error writing trailer") || text.includes("Error closing file")) {
            console.log(`[Stream #${connectionId}] FFmpeg (shutdown):`, text.trim());
          }
        } else {
          console.log(`[Stream #${connectionId}] FFmpeg:`, text.trim());
        }
      }
    });

    ffmpeg.stdout.on("data", (data) => {
      console.log(`[Stream #${connectionId}] FFmpeg STDOUT:`, data.toString());
    });

    ws.on("message", (msg) => {
      if (Buffer.isBuffer(msg)) {
        bytesReceived += msg.length;

        // Update connection tracking
        const conn = activeConnections.get(connectionId);
        if (conn) {
          conn.bytesReceived = bytesReceived;
        }

        if (bytesReceived % 500000 < msg.length) {
          // Log every ~500KB
          console.log(
            `[Stream #${connectionId}] Received ${Math.floor(bytesReceived / 1024)}KB`,
          );
        }

        try {
          ffmpeg.stdin.write(msg);
        } catch (err) {
          console.error(
            `[Stream #${connectionId}] Error writing to FFmpeg:`,
            err.message,
          );
        }
      } else {
        console.log(
          `[Stream #${connectionId}] Received non-buffer message:`,
          msg.toString().substring(0, 100),
        );
      }
    });

    ws.on("close", (e) => {
      isShuttingDown = true;
      const conn = activeConnections.get(connectionId);
      const duration = conn
        ? ((Date.now() - conn.startTime) / 1000).toFixed(1)
        : "0.0";
      
      console.log(
        `\n[Stream #${connectionId}] WebSocket closed. Duration: ${duration}s, Total: ${Math.floor(bytesReceived / 1024)}KB`,
      );

      activeConnections.delete(connectionId);
      console.log(
        `[Stream #${connectionId}] Remaining active streams: ${activeConnections.size}`,
      );

      try {
        // Close FFmpeg stdin immediately - don't wait for flush
        // Mux likely already closed the connection, so flushing will fail anyway
        console.log(
          `[Stream #${connectionId}] Closing FFmpeg stdin...`,
        );
        ffmpeg.stdin.end();
        
        // Give FFmpeg a short time to exit cleanly
        setTimeout(() => {
          if (!ffmpeg.killed) {
            console.log(
              `[Stream #${connectionId}] FFmpeg still running, sending SIGINT...`,
            );
            ffmpeg.kill("SIGINT");
            
            // Last resort: force kill if it doesn't respond to SIGINT
            setTimeout(() => {
              if (!ffmpeg.killed) {
                console.log(
                  `[Stream #${connectionId}] Force killing FFmpeg...`,
                );
                ffmpeg.kill("SIGKILL");
              }
            }, 1000);
          }
        }, 1000);
      } catch (err) {
        console.error(
          `[Stream #${connectionId}] Error closing FFmpeg:`,
          err.message,
        );
      }
    });

    ws.on("error", (error) => {
      console.error(
        `[Stream #${connectionId}] WebSocket error:`,
        error.message,
      );
    });
  });
});
