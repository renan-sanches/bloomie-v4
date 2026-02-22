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
  try {
    const { flow: flowName } = await params;
    const body = await req.json();

    const flow = getFlow(flowName);

    if (!flow) {
      return NextResponse.json(
        { error: `Flow "${flowName}" not found` },
        { status: 404 }
      );
    }

    const result = await flow(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
