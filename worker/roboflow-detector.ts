import axios from "axios";
import { extractFramesAtFps, type VideoFrame } from "./ffmpeg-frames.js";
import type {
  Detection,
  ObjectDetection,
  RoboflowAnalysisResponse,
} from "./types.js";

const ROBOFLOW_API_URL =
  "https://serverless.roboflow.com/person-detection-j44uo/1";
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
if (!ROBOFLOW_API_KEY) {
  throw new Error("ROBOFLOW_API_KEY environment variable is required");
}
const FRAME_RATE = 8;
const CONFIDENCE_THRESHOLD = 0.3;

interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

interface RoboflowResponse {
  predictions: RoboflowPrediction[];
  image: {
    width: number;
    height: number;
  };
}

async function detectFrame(frameBuffer: Buffer): Promise<Detection[]> {
  try {
    const base64Image = frameBuffer.toString("base64");

    const response = await axios.post<RoboflowResponse>(
      ROBOFLOW_API_URL,
      base64Image,
      {
        params: { api_key: ROBOFLOW_API_KEY },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const { predictions, image } = response.data;

    const detections: Detection[] = predictions
      .filter((pred) => pred.confidence >= CONFIDENCE_THRESHOLD)
      .map((pred) => {
        const topLeftX = pred.x - pred.width / 2;
        const topLeftY = pred.y - pred.height / 2;

        const normalizedBbox = {
          x: Math.max(0, Math.min(1, topLeftX / image.width)),
          y: Math.max(0, Math.min(1, topLeftY / image.height)),
          width: Math.max(0, Math.min(1, pred.width / image.width)),
          height: Math.max(0, Math.min(1, pred.height / image.height)),
        };

        return {
          class: "person",
          confidence: pred.confidence,
          bbox: normalizedBbox,
        };
      });

    return detections;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Roboflow API error: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
      }
    } else {
      console.error(`Frame detection error:`, error);
    }
    return [];
  }
}

export async function analyzeVideoWithRoboflow(
  videoBuffer: Buffer,
  segmentStartTime: number = 0,
): Promise<RoboflowAnalysisResponse> {
  console.log(
    `Starting Roboflow detection at ${FRAME_RATE} FPS (confidence threshold: ${CONFIDENCE_THRESHOLD}, segment offset: ${segmentStartTime}s)...`,
  );

  const frames = await extractFramesAtFps(
    videoBuffer,
    FRAME_RATE,
    segmentStartTime,
  );
  console.log(
    `Processing ${frames.length} frames (timestamps: ${frames[0]?.timestamp.toFixed(2)}s - ${frames[frames.length - 1]?.timestamp.toFixed(2)}s)...`,
  );

  const objectDetections: ObjectDetection[] = [];
  let totalDetections = 0;
  let framesWithDetections = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    try {
      const detections = await detectFrame(frame.buffer);

      objectDetections.push({
        frame_timestamp: frame.timestamp,
        frame_index: i,
        detections,
      });

      if (detections.length > 0) {
        totalDetections += detections.length;
        framesWithDetections++;
      }

      if ((i + 1) % 25 === 0) {
        console.log(
          `Processed ${i + 1}/${frames.length} frames (${framesWithDetections} with detections)`,
        );
      }
    } catch (error) {
      console.error(`Error processing frame ${i}:`, error);
    }
  }

  const coveragePercent = (framesWithDetections / frames.length) * 100;
  console.log(
    `Roboflow complete: ${totalDetections} detections in ${framesWithDetections}/${frames.length} frames (${coveragePercent.toFixed(1)}% coverage)`,
  );

  return {
    detections: objectDetections,
    totalFrames: frames.length,
    totalDetections,
  };
}
