"use client";
import { useState, useEffect } from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { roomsRef } from "@/lib/firestore";
import { usePlants } from "@/hooks/use-plants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Plus } from "lucide-react";
import Link from "next/link";
import type { Room } from "@/types";

export const dynamic = "force-dynamic";

export default function RoomsPage() {
  const { user } = useAuth();
  const { plants } = usePlants(user?.uid);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(roomsRef(user.uid), (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Room)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const plantCountByRoom = (roomId: string) =>
    plants.filter((p) => p.roomId === roomId).length;

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-brand-carbon">
          My Rooms <span className="inline-block">🏠</span>
        </h1>
        <Link href="/rooms/add">
          <Button className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Room</span>
          </Button>
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[32px]" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 mt-24 text-center">
          <span className="text-6xl">🏠</span>
          <p className="text-brand-carbon/60 text-base max-w-xs">
            No rooms yet. Add your first room to organize your plants.
          </p>
          <Link href="/rooms/add">
            <Button className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] gap-2">
              <Plus size={18} />
              Add Room
            </Button>
          </Link>
        </div>
      ) : (
        /* Room grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const count = plantCountByRoom(room.id);
            const badges: string[] = [];
            if (room.windowDirection) badges.push(labelMap[room.windowDirection] ?? room.windowDirection);
            if (room.brightness) badges.push(labelMap[room.brightness] ?? room.brightness);
            if (room.humidity) badges.push(`Humidity: ${labelMap[room.humidity] ?? room.humidity}`);
            if (room.tempTendency) badges.push(labelMap[room.tempTendency] ?? room.tempTendency);

            return (
              <div
                key={room.id}
                className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Home size={20} className="text-brand-green shrink-0" />
                    <h2 className="font-bold text-lg text-brand-carbon leading-tight">
                      {room.name}
                    </h2>
                  </div>
                </div>

                {/* Environment badges */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="bg-brand-card rounded-[12px] px-2 py-1 text-xs text-brand-carbon/70 font-medium"
                      >
                        {badge}
                      </span>
                    ))}
                    {room.draftRisk && (
                      <span className="bg-brand-orange/20 text-brand-orange rounded-[12px] px-2 py-1 text-xs font-medium">
                        Draft risk
                      </span>
                    )}
                  </div>
                )}

                {/* Plant count + View button */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-brand-carbon/50">
                    {count} {count === 1 ? "plant" : "plants"}
                  </span>
                  <Link href={`/rooms/${room.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-[16px] border-brand-green text-brand-green hover:bg-brand-green/5"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
