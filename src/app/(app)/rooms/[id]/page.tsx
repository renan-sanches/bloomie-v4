"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { clearPlantRoom, getRoom, deleteRoom, setPlant } from "@/lib/firestore";
import { usePlants } from "@/hooks/use-plants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Trash2,
  Compass,
  Sun,
  Droplets,
  Thermometer,
  Wind,
} from "lucide-react";
import Link from "next/link";
import type { Room } from "@/types";

export default function RoomDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const { plants, loading: plantsLoading } = usePlants(user?.uid);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getRoom(user.uid, roomId).then((snap) => {
      if (snap.exists()) {
        setRoom({ id: snap.id, ...snap.data() } as Room);
      }
      setRoomLoading(false);
    });
  }, [user, roomId]);

  const plantsInRoom = plants.filter((p) => p.roomId === roomId);
  const plantsNotInRoom = plants.filter((p) => p.roomId !== roomId);

  const handleDelete = async () => {
    if (!user || !window.confirm(`Delete "${room?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteRoom(user.uid, roomId);
    router.push("/rooms");
  };

  const handleAssign = async () => {
    if (!user || !selectedPlantId) return;
    setAssigning(selectedPlantId);
    await setPlant(user.uid, selectedPlantId, { roomId });
    setSelectedPlantId("");
    setAssigning(null);
  };

  const handleRemove = async (plantId: string) => {
    if (!user) return;
    setRemoving(plantId);
    await clearPlantRoom(user.uid, plantId);
    setRemoving(null);
  };

  const labelMap: Record<string, string> = {
    north: "North",
    south: "South",
    east: "East",
    west: "West",
    none: "No window",
    low: "Low",
    medium: "Medium",
    high: "High",
    bright: "Bright",
    direct: "Direct sun",
    cool: "Cool",
    moderate: "Moderate",
    warm: "Warm",
  };

  // Room insights
  const insights: string[] = [];
  if (room) {
    if (room.brightness === "low") {
      insights.push("Best for: Snake plants, ZZ plants, Pothos");
    } else if (room.brightness === "direct") {
      insights.push("Best for: Cacti, succulents, herbs");
    } else if (room.brightness === "bright") {
      insights.push("Best for: Monstera, Fiddle Leaf Fig, Bird of Paradise");
    }
    if (room.humidity === "high") {
      insights.push("High humidity room — great for tropical plants!");
    }
    if (room.draftRisk) {
      insights.push("Draft risk detected — keep sensitive plants away from windows");
    }
  }

  const loading = roomLoading || plantsLoading;

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-48 rounded-[16px]" />
        <Skeleton className="h-40 rounded-[32px]" />
        <Skeleton className="h-40 rounded-[32px]" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center mt-24">
        <p className="text-brand-carbon/60">Room not found.</p>
        <Link href="/rooms">
          <Button className="mt-4 rounded-[16px]">Back to Rooms</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-brand-carbon/60 text-sm hover:text-brand-carbon transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-2xl font-extrabold text-brand-carbon">{room.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/rooms/${roomId}/edit`}>
            <Button
              size="sm"
              variant="outline"
              className="rounded-[16px] border-brand-carbon/20 text-brand-carbon"
            >
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="rounded-[16px] border-red-200 text-red-500 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={15} className="mr-1" />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      {/* Environment profile card */}
      <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3">
        <h2 className="font-bold text-brand-carbon text-base">Environment Profile</h2>
        <div className="flex flex-col gap-2.5">
          {room.windowDirection && (
            <div className="flex items-center gap-3">
              <Compass size={16} className="text-brand-carbon/50 shrink-0" />
              <span className="text-sm text-brand-carbon/70">Window:</span>
              <span className="text-sm font-semibold text-brand-carbon">
                {labelMap[room.windowDirection] ?? room.windowDirection}
              </span>
            </div>
          )}
          {room.brightness && (
            <div className="flex items-center gap-3">
              <Sun size={16} className="text-brand-orange shrink-0" />
              <span className="text-sm text-brand-carbon/70">Brightness:</span>
              <span className="text-sm font-semibold text-brand-carbon">
                {labelMap[room.brightness] ?? room.brightness}
              </span>
            </div>
          )}
          {room.humidity && (
            <div className="flex items-center gap-3">
              <Droplets size={16} className="text-blue-400 shrink-0" />
              <span className="text-sm text-brand-carbon/70">Humidity:</span>
              <span className="text-sm font-semibold text-brand-carbon">
                {labelMap[room.humidity] ?? room.humidity}
              </span>
            </div>
          )}
          {room.tempTendency && (
            <div className="flex items-center gap-3">
              <Thermometer size={16} className="text-red-400 shrink-0" />
              <span className="text-sm text-brand-carbon/70">Temperature:</span>
              <span className="text-sm font-semibold text-brand-carbon">
                {labelMap[room.tempTendency] ?? room.tempTendency}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Wind size={16} className="text-brand-purple shrink-0" />
            <span className="text-sm text-brand-carbon/70">Draft risk:</span>
            <span className="text-sm font-semibold text-brand-carbon">
              {room.draftRisk ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Room Insights */}
      {insights.length > 0 && (
        <div className="bg-brand-green/10 rounded-[32px] p-5 flex flex-col gap-2">
          <h2 className="font-bold text-brand-green text-base">Room Insights</h2>
          <ul className="flex flex-col gap-1.5">
            {insights.map((tip) => (
              <li key={tip} className="text-sm text-brand-carbon/80 flex items-start gap-2">
                <span className="mt-0.5 text-brand-green">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Plants in this room */}
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-brand-carbon text-base">
          Plants in this room
          {plantsInRoom.length > 0 && (
            <span className="ml-2 text-brand-carbon/40 font-normal text-sm">
              ({plantsInRoom.length})
            </span>
          )}
        </h2>
        {plantsInRoom.length === 0 ? (
          <p className="text-sm text-brand-carbon/40">
            No plants assigned to this room yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {plantsInRoom.map((plant) => {
              const healthColor =
                plant.healthScore >= 80
                  ? "text-brand-green"
                  : plant.healthScore >= 50
                  ? "text-brand-orange"
                  : "text-red-500";

              return (
                <div
                  key={plant.id}
                  className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col"
                >
                  {/* Thumbnail */}
                  <Link href={`/jungle/${plant.id}`} className="block">
                    <div className="aspect-square bg-[#2C3E2F] flex items-center justify-center relative">
                      {plant.photoUrl ? (
                        <Image
                          src={plant.photoUrl}
                          alt={plant.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-4xl select-none">🌿</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-3 flex flex-col gap-2">
                    <p className="font-bold text-sm text-brand-carbon leading-tight truncate">
                      {plant.name}
                    </p>
                    <span
                      className={`text-xs font-semibold bg-brand-card rounded-[12px] px-2 py-0.5 self-start ${healthColor}`}
                    >
                      {plant.healthScore}% health
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-[16px] text-xs border-red-200 text-red-400 hover:bg-red-50 mt-1"
                      onClick={() => handleRemove(plant.id)}
                      disabled={removing === plant.id}
                    >
                      {removing === plant.id ? "Removing…" : "Remove from room"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Plants */}
      {plantsNotInRoom.length > 0 && (
        <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3">
          <h2 className="font-bold text-brand-carbon text-base">Assign a Plant</h2>
          <p className="text-xs text-brand-carbon/50">
            Select a plant to add it to this room.
          </p>
          <div className="flex gap-2 items-center">
            <Select
              value={selectedPlantId}
              onValueChange={setSelectedPlantId}
            >
              <SelectTrigger className="rounded-[16px] flex-1">
                <SelectValue placeholder="Select a plant…" />
              </SelectTrigger>
              <SelectContent>
                {plantsNotInRoom.map((plant) => (
                  <SelectItem key={plant.id} value={plant.id}>
                    {plant.name}
                    {plant.roomId ? " (in another room)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] shrink-0"
              disabled={!selectedPlantId || assigning === selectedPlantId}
              onClick={handleAssign}
            >
              {assigning ? "Assigning…" : "Assign"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
