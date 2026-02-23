"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PhotoUploader } from "@/components/scanner/PhotoUploader";
import { IdentifyResult } from "@/components/scanner/IdentifyResult";
import { Skeleton } from "@/components/ui/skeleton";
import { callAiFlow } from "@/lib/ai-client";


interface IdentifyData {
  commonName: string;
  scientificName: string;
  confidence: number;
  description: string;
  careDifficulty: "easy" | "moderate" | "hard";
  suggestedCareProfile: {
    wateringFrequencyDays: number;
    sunlight: "low" | "indirect" | "bright" | "direct";
    humidity: "low" | "medium" | "high";
    tempMin: number;
    tempMax: number;
  };
}

export default function AddPlantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<IdentifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastBase64, setLastBase64] = useState("");

  const wishlistHint = useMemo(() => {
    const fromWishlist = searchParams.get("wishlist");
    const legacyName = searchParams.get("name");
    return fromWishlist || legacyName || "";
  }, [searchParams]);

  const handlePhoto = async (base64: string) => {
    setLastBase64(base64);
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await callAiFlow<IdentifyData>("identify-plant", { photoBase64: base64 });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze this photo.");
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError("");
    setLastBase64("");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-brand-carbon/60 mb-6 text-sm hover:text-brand-carbon transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="text-2xl font-extrabold text-brand-carbon mb-2">Add Plant with AI</h1>
      <p className="text-sm text-brand-carbon/60 mb-6">
        Upload or capture one clear photo. Bloomie identifies the plant and auto-creates care settings.
      </p>

      {wishlistHint && (
        <div className="mb-4 bg-brand-card rounded-[16px] px-4 py-3 text-sm text-brand-carbon/70">
          Wishlist target: <span className="font-semibold text-brand-carbon">{wishlistHint}</span>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-6">
        <PhotoUploader onPhoto={handlePhoto} onClear={resetAnalysis} disabled={loading} />
      </div>

      {loading && (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-4 w-3/4 rounded-[12px]" />
          <Skeleton className="h-32 rounded-[32px]" />
          <Skeleton className="h-4 w-1/2 rounded-[12px]" />
        </div>
      )}

      {error && (
        <div className="mt-6 bg-rose-50 border border-rose-200 rounded-[32px] p-4">
          <p className="text-sm text-rose-500 font-semibold">Could not identify plant</p>
          <p className="text-sm text-rose-400 mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && result && (
        <div className="mt-6">
          <IdentifyResult
            data={result}
            photoBase64={lastBase64}
            onAdded={(plantId) => router.push(`/jungle/${plantId}`)}
          />
        </div>
      )}
    </div>
  );
}
