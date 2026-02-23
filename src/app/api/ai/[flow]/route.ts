import { NextRequest, NextResponse } from "next/server";
import { getFlow } from "@/ai/registry";

const flowLoaders: Record<string, () => Promise<unknown>> = {
  "identify-plant": () => import("@/ai/flows/identify-plant"),
  "diagnose-plant": () => import("@/ai/flows/diagnose-plant"),
  "measure-environment": () => import("@/ai/flows/measure-environment"),
  "propagate-analysis": () => import("@/ai/flows/propagate-analysis"),
  "growth-analysis": () => import("@/ai/flows/growth-analysis"),
  "placement-helper": () => import("@/ai/flows/placement-helper"),
  "generate-care-plan": () => import("@/ai/flows/generate-care-plan"),
  "bloomie-chat": () => import("@/ai/flows/bloomie-chat"),
  "generate-living-portrait": () => import("@/ai/flows/generate-living-portrait"),
  "call-plant": () => import("@/ai/flows/call-plant"),
  "health-prediction": () => import("@/ai/flows/health-prediction"),
  "weekly-report": () => import("@/ai/flows/weekly-report"),
  "weather-adjustment": () => import("@/ai/flows/weather-adjustment"),
};

const loadedFlows = new Set<string>();

async function ensureFlowLoaded(flowName: string) {
  if (loadedFlows.has(flowName)) return;

  const loader = flowLoaders[flowName];
  if (!loader) return;

  await loader();
  loadedFlows.add(flowName);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ flow: string }> }
) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      {
        code: "AI_CONFIG_MISSING",
        error: "AI is not configured. Set GOOGLE_AI_API_KEY and restart the app.",
      },
      { status: 503 }
    );
  }

  try {
    const { flow: flowName } = await params;
    await ensureFlowLoaded(flowName);

    const flow = getFlow(flowName);
    if (!flow) {
      return NextResponse.json(
        { error: `Flow "${flowName}" not found` },
        { status: 404 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const result = await flow(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const lowered = message.toLowerCase();
    const safeMessage =
      lowered.includes("model") && lowered.includes("not found")
        ? "AI model is unavailable. Update model configuration and try again."
        : lowered.includes("api key")
        ? "AI API key is invalid or missing."
        : message;
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
