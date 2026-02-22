"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoUploader } from "@/components/scanner/PhotoUploader";
import { IdentifyResult } from "@/components/scanner/IdentifyResult";
import { DiagnoseResult } from "@/components/scanner/DiagnoseResult";

export const dynamic = "force-dynamic";

type Mode = "identify" | "diagnose" | "measure" | "propagate" | "placement";

const FLOW_MAP: Record<Mode, string> = {
  identify: "identify-plant",
  diagnose: "diagnose-plant",
  measure: "measure-environment",
  propagate: "propagate-analysis",
  placement: "placement-helper",
};

const MODE_LABELS: Record<Mode, string> = {
  identify: "Identify",
  diagnose: "Diagnose",
  measure: "Measure",
  propagate: "Propagate",
  placement: "Placement",
};

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  identify: "Point at any plant to identify its species and get care info",
  diagnose: "Analyze your plant for pests, disease, or nutrient issues",
  measure: "Estimate light levels and environment quality",
  propagate: "Check if your water cuttings are ready for soil",
  placement: "Find the best spots in your room for plants",
};

async function callFlow(flowName: string, body: object) {
  const res = await fetch(`/api/ai/${flowName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "AI request failed");
  }
  return res.json();
}

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>("identify");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastBase64, setLastBase64] = useState<string>("");

  const handlePhoto = async (base64: string) => {
    setLastBase64(base64);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const flowName = FLOW_MAP[mode];
      let body: object;
      if (mode === "placement") {
        body = { roomPhotoBase64: base64, plantNames: [] };
      } else {
        body = { photoBase64: base64 };
      }
      const data = await callFlow(flowName, body);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    if (mode === "identify") return <IdentifyResult data={result} photoBase64={lastBase64} />;
    if (mode === "diagnose") return <DiagnoseResult data={result} />;
    // Generic JSON result for other modes (will be replaced with dedicated result cards in Phase 4)
    return (
      <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-6">
        <pre className="text-xs text-brand-carbon/70 whitespace-pre-wrap overflow-auto max-h-80">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-brand-carbon mb-2">AI Scanner</h1>
      <p className="text-sm text-brand-carbon/50 mb-6">
        {MODE_DESCRIPTIONS[mode]}
      </p>

      <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setResult(null); setError(""); }}>
        <TabsList className="mb-6 w-full flex flex-wrap h-auto gap-1 bg-brand-card p-1 rounded-[16px]">
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <TabsTrigger
              key={m}
              value={m}
              className="flex-1 min-w-[80px] rounded-[12px] text-xs data-[state=active]:bg-white data-[state=active]:text-brand-green data-[state=active]:font-bold"
            >
              {MODE_LABELS[m]}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
          <TabsContent key={m} value={m}>
            <PhotoUploader onPhoto={handlePhoto} disabled={loading} />
          </TabsContent>
        ))}
      </Tabs>

      {/* State feedback */}
      {loading && (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-4 w-3/4 rounded-[12px]" />
          <Skeleton className="h-32 rounded-[32px]" />
          <Skeleton className="h-4 w-1/2 rounded-[12px]" />
        </div>
      )}
      {error && (
        <div className="mt-6 bg-rose-50 border border-rose-200 rounded-[32px] p-4">
          <p className="text-sm text-rose-500 font-semibold">Error</p>
          <p className="text-sm text-rose-400 mt-1">{error}</p>
        </div>
      )}
      {!loading && !error && result && (
        <div className="mt-6">{renderResult()}</div>
      )}
    </div>
  );
}
