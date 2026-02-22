"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useAuth } from "@/contexts/AuthContext";
import { setPlant, setQuest } from "@/lib/firestore";
import { uploadPlantPhoto } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import type { Plant, Quest } from "@/types";

export const dynamic = "force-dynamic";

export default function AddPlantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [wateringDays, setWateringDays] = useState(7);
  const [sunlight, setSunlight] = useState<Plant["careProfile"]["sunlight"]>("indirect");
  const [humidity, setHumidity] = useState<Plant["careProfile"]["humidity"]>("medium");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const plantId = nanoid();
      const nextWater = new Date();
      nextWater.setDate(nextWater.getDate() + wateringDays);
      const nextWaterDate = nextWater.toISOString().split("T")[0];

      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await uploadPlantPhoto(user.uid, plantId, photo);
      }

      const plant: Plant = {
        id: plantId,
        userId: user.uid,
        name: name.trim(),
        species: species.trim(),
        healthScore: 85,
        photoUrl,
        careProfile: {
          wateringFrequencyDays: wateringDays,
          sunlight,
          tempMin: 60,
          tempMax: 85,
          humidity,
        },
        nextWaterDate,
        addedAt: new Date().toISOString(),
        status: "healthy",
      };

      await setPlant(user.uid, plantId, plant);

      // Create first watering quest
      const questId = nanoid();
      const quest: Quest = {
        id: questId,
        userId: user.uid,
        plantId,
        plantName: name.trim(),
        type: "water",
        dueDate: nextWaterDate,
        status: "pending",
        xpReward: 10,
      };
      await setQuest(user.uid, questId, quest);

      router.push(`/jungle/${plantId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to add plant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-brand-carbon/60 mb-6 text-sm hover:text-brand-carbon transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="text-2xl font-extrabold text-brand-carbon mb-6">
        Add a Plant
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Photo upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-32 h-32 rounded-[32px] bg-[#2C3E2F] overflow-hidden flex items-center justify-center">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl select-none">🌿</span>
            )}
          </div>
          <label className="cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-semibold text-brand-green border border-brand-green rounded-[16px] px-4 py-2 hover:bg-brand-green/5 transition-colors">
              <Upload size={16} />
              {photo ? "Change Photo" : "Add Photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Plant name <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="e.g. Big Monstera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-[16px]"
          />
        </div>

        {/* Species */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Species{" "}
            <span className="text-brand-carbon/40 font-normal">(optional)</span>
          </label>
          <Input
            placeholder="e.g. Monstera deliciosa"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="rounded-[16px]"
          />
        </div>

        {/* Watering frequency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Water every
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={60}
              value={wateringDays}
              onChange={(e) => setWateringDays(Number(e.target.value))}
              className="rounded-[16px] w-24"
            />
            <span className="text-sm text-brand-carbon/60">days</span>
          </div>
        </div>

        {/* Sunlight */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Sunlight
          </label>
          <Select
            value={sunlight}
            onValueChange={(v) =>
              setSunlight(v as Plant["careProfile"]["sunlight"])
            }
          >
            <SelectTrigger className="rounded-[16px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low light</SelectItem>
              <SelectItem value="indirect">Bright indirect</SelectItem>
              <SelectItem value="bright">Bright direct</SelectItem>
              <SelectItem value="direct">Full sun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Humidity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Humidity preference
          </label>
          <Select
            value={humidity}
            onValueChange={(v) =>
              setHumidity(v as Plant["careProfile"]["humidity"])
            }
          >
            <SelectTrigger className="rounded-[16px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] h-12 text-base font-semibold mt-2"
        >
          {loading ? "Adding plant…" : "Add to Jungle 🌿"}
        </Button>
      </form>
    </div>
  );
}
