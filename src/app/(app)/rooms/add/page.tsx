"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useAuth } from "@/contexts/AuthContext";
import { setRoom } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import type { Room } from "@/types";

export const dynamic = "force-dynamic";

export default function AddRoomPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [windowDirection, setWindowDirection] = useState<Room["windowDirection"]>("none");
  const [brightness, setBrightness] = useState<Room["brightness"]>("medium");
  const [humidity, setHumidity] = useState<Room["humidity"]>("medium");
  const [tempTendency, setTempTendency] = useState<Room["tempTendency"]>("moderate");
  const [draftRisk, setDraftRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const roomId = nanoid();
      const room: Room = {
        id: roomId,
        userId: user.uid,
        name: name.trim(),
        windowDirection,
        brightness,
        humidity,
        tempTendency,
        draftRisk,
      };

      await setRoom(user.uid, roomId, room);
      router.push("/rooms");
    } catch (err) {
      console.error(err);
      setError("Failed to add room. Please try again.");
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
        Add a Room
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Room name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Room name <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="e.g. Living Room"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-[16px]"
          />
        </div>

        {/* Window direction */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Window direction
          </label>
          <Select
            value={windowDirection}
            onValueChange={(v) => setWindowDirection(v as Room["windowDirection"])}
          >
            <SelectTrigger className="rounded-[16px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="east">East</SelectItem>
              <SelectItem value="west">West</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Brightness */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Brightness
          </label>
          <Select
            value={brightness}
            onValueChange={(v) => setBrightness(v as Room["brightness"])}
          >
            <SelectTrigger className="rounded-[16px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="bright">Bright</SelectItem>
              <SelectItem value="direct">Direct sun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Humidity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Humidity
          </label>
          <Select
            value={humidity}
            onValueChange={(v) => setHumidity(v as Room["humidity"])}
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

        {/* Temperature tendency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-carbon">
            Temperature tendency
          </label>
          <Select
            value={tempTendency}
            onValueChange={(v) => setTempTendency(v as Room["tempTendency"])}
          >
            <SelectTrigger className="rounded-[16px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cool">Cool</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Draft risk toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={draftRisk}
            onClick={() => setDraftRisk((prev) => !prev)}
            className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-colors ${
              draftRisk
                ? "bg-brand-green border-brand-green"
                : "border-brand-carbon/30 bg-white"
            }`}
          >
            {draftRisk && (
              <svg
                viewBox="0 0 10 8"
                fill="none"
                className="w-3 h-3"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <label
            className="text-sm font-semibold text-brand-carbon cursor-pointer select-none"
            onClick={() => setDraftRisk((prev) => !prev)}
          >
            Draft risk
          </label>
          <span className="text-xs text-brand-carbon/40">
            (cold air from windows/doors)
          </span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] h-12 text-base font-semibold mt-2"
        >
          {loading ? "Adding room…" : "Add Room 🏠"}
        </Button>
      </form>
    </div>
  );
}
