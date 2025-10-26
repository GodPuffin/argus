"use client";

import TextHighlighter from "@/components/fancy/text/text-highlighter";
import ScrambleHover from "@/components/fancy/text/scramble-hover";
import { Badge } from "@/components/ui/badge";

const aiModels = [
  "Gemini 2.5 Pro",
  "Claude 4.5 Haiku",
  "Claude 4.5 Sonnet",
  "Kimi K2 Instruct",
  "Letta Stateful Agent",
  "Elasticsearch Agent",
  "Roboflow 3.0 Object Detection",

];

export function ModelsSection() {
  return (
    <div className="w-full max-w-[80%] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Text with Highlighter */}
        <div className="space-y-6">
          <p className="text-lg leading-loose">
            Argus leverages the{" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              best in AI technology
            </TextHighlighter>
            , combining cutting-edge{" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              computer vision
            </TextHighlighter>{" "}
            and{" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              natural language processing
            </TextHighlighter>{" "}
            to deliver unparalleled{" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              security and surveillance
            </TextHighlighter>{" "}
            capabilities. Argus intelligently analyzes video feeds in{" "} 
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              real-time
            </TextHighlighter>, detecting {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              anomalies
            </TextHighlighter>, identifying threats, and generating{" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              comprehensive reports
            </TextHighlighter> to keep you informed and protected.
            
            <br />

           </p>
          <p className="text-lg leading-loose">
            Built on a {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              real-time streaming pipeline
            </TextHighlighter>{" "}
            with {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              Mux
            </TextHighlighter>{" "}
            and {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              FFmpeg transmuxing
            </TextHighlighter>
            , Argus delivers {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              low-latency playback
            </TextHighlighter>{" "}
            and resilient delivery while segments are scheduled and analyzed at the edge.
          </p>

          <p className="text-lg leading-loose">
            Detections from {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              Roboflow object detection
            </TextHighlighter>{" "}
            and AI summaries from {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              Gemini
            </TextHighlighter>{" "}
            are indexed into {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              Elasticsearch
            </TextHighlighter>{" "}
            with rich {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              structured metadata
            </TextHighlighter>
            , and persisted via {" "}
            <TextHighlighter
              triggerType="inView"
              highlightColor="hsl(0, 100%, 31%)"
              direction="ltr"
            >
              Supabase Realtime & Edge Functions
            </TextHighlighter>{" "}
             so you're always in the loop.
          </p>
        </div>

        {/* Right: AI Models List */}
        <div className="space-y-6 lg:pl-12">
          <div className="mb-4 text-right">
            <Badge variant="secondary" className="mb-6">
              Powered by
            </Badge>
          </div>
          <div className="space-y-8 text-right">
            {aiModels.map((model, index) => (
              <div key={index} className="text-2xl font-semibold">
                <ScrambleHover
                  text={model}
                  sequential={true}
                  revealDirection="start"
                  scrambleSpeed={30}
                  maxIterations={8}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

