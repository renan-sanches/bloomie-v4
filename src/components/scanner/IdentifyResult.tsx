"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useAuth } from "@/contexts/AuthContext";
import { setPlant, setQuest } from "@/lib/firestore";
import { uploadPlantPhoto } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import type { Plant, Quest } from "@/types";

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

const difficultyColors: Record<string, string> = {
  easy: "bg-brand-green/10 text-brand-green",
  moderate: "bg-amber-50 text-amber-600",
  hard: "bg-rose-50 text-rose-500",
};

function base64ToFile(base64: string, filename: string): File {
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return new File([bytes], filename, { type: "image/jpeg" });
}

export function IdentifyResult({
  data,
  photoBase64,
  onAdded,
}: {
  data: IdentifyData;
  photoBase64?: string;
  onAdded?: (plantId: string) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [saveError, setSaveError] = useState("");

  const addToJungle = async () => {
    if (!user) {
      setSaveError("You need to sign in before adding plants.");
      return;
    }
    setSaveError("");
    setAdding(true);
    try {
      const plantId = nanoid();
      const nextWater = new Date();
      nextWater.setDate(nextWater.getDate() + data.suggestedCareProfile.wateringFrequencyDays);
      const nextWaterDate = nextWater.toISOString().split("T")[0];
      const initialHealthScore = Math.round(70 + Math.max(0, Math.min(1, data.confidence)) * 25);

      let photoUrl: string | undefined;
      if (photoBase64) {
        try {
          const imageFile = base64ToFile(photoBase64, `${plantId}.jpg`);
          photoUrl = await uploadPlantPhoto(user.uid, plantId, imageFile);
        } catch (uploadErr) {
          console.error("Failed to upload plant photo", uploadErr);
        }
      }

      const plant: Plant = {
        id: plantId,
        userId: user.uid,
        name: data.commonName,
        species: data.scientificName || data.commonName,
        healthScore: initialHealthScore,
        ...(photoUrl ? { photoUrl } : {}),
        careProfile: {
          wateringFrequencyDays: data.suggestedCareProfile.wateringFrequencyDays,
          sunlight: data.suggestedCareProfile.sunlight,
          tempMin: data.suggestedCareProfile.tempMin,
          tempMax: data.suggestedCareProfile.tempMax,
          humidity: data.suggestedCareProfile.humidity,
        },
        nextWaterDate,
        addedAt: new Date().toISOString(),
        status: "healthy",
      };

      await setPlant(user.uid, plantId, plant);

      try {
        const quest: Quest = {
          id: nanoid(),
          userId: user.uid,
          plantId,
          plantName: data.commonName,
          type: "water",
          dueDate: nextWaterDate,
          status: "pending",
          xpReward: 10,
        };
        await setQuest(user.uid, quest.id, quest);
      } catch (questErr) {
        // Keep plant creation successful even if quest creation fails.
        console.error("Failed to create initial watering quest", questErr);
      }

      setAdded(true);
      if (onAdded) {
        onAdded(plantId);
      } else {
        setTimeout(() => router.push(`/jungle/${plantId}`), 1000);
      }
    } catch (err) {
      console.error("Failed to add plant from identification", err);
      setSaveError("Could not add this plant right now. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-brand-carbon">{data.commonName}</h3>
          <p className="text-sm text-brand-carbon/50 italic">{data.scientificName}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge className={`rounded-[12px] capitalize ${difficultyColors[data.careDifficulty]}`}>
            {data.careDifficulty}
          </Badge>
          <span className="text-xs text-brand-carbon/40">
            {Math.round(data.confidence * 100)}% match
          </span>
        </div>
      </div>

      <p className="text-sm text-brand-carbon/70 leading-relaxed">{data.description}</p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-brand-card rounded-[12px] p-3">
          <p className="text-xs text-brand-carbon/40 mb-0.5">Water every</p>
          <p className="font-semibold text-brand-carbon">{data.suggestedCareProfile.wateringFrequencyDays} days</p>
        </div>
        <div className="bg-brand-card rounded-[12px] p-3">
          <p className="text-xs text-brand-carbon/40 mb-0.5">Sunlight</p>
          <p className="font-semibold text-brand-carbon capitalize">{data.suggestedCareProfile.sunlight}</p>
        </div>
      </div>

      <Button
        className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] h-11 gap-2"
        onClick={addToJungle}
        disabled={adding || added}
      >
        {added ? (
          <><CheckCircle size={18} /> Added to Jungle!</>
        ) : adding ? (
          <><Loader2 size={18} className="animate-spin" /> Adding…</>
        ) : (
          "Add to Jungle 🌿"
        )}
      </Button>
      {saveError && <p className="text-sm text-rose-500">{saveError}</p>}
    </div>
  );
}
