import { NextRequest, NextResponse } from "next/server";

// Import all flows so they self-register via registerFlow()
import "@/ai/flows/identify-plant";
import "@/ai/flows/diagnose-plant";
import "@/ai/flows/measure-environment";
import "@/ai/flows/propagate-analysis";
import "@/ai/flows/growth-analysis";
import "@/ai/flows/placement-helper";
import "@/ai/flows/generate-care-plan";
import "@/ai/flows/bloomie-chat";
import "@/ai/flows/generate-living-portrait";
import "@/ai/flows/call-plant";
import "@/ai/flows/health-prediction";
import "@/ai/flows/weekly-report";
import "@/ai/flows/weather-adjustment";

import { getFlow } from "@/ai/registry";

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
