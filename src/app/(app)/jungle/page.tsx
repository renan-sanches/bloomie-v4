"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlants } from "@/hooks/use-plants";
import { PlantGrid } from "@/components/plants/PlantGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScanLine, Plus, Star, Archive } from "lucide-react";
import Link from "next/link";


type Filter = "all" | "water" | "sick" | "propagating" | "archive";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "water", label: "To Water" },
  { key: "sick", label: "Sick Bay" },
  { key: "propagating", label: "Propagating" },
  { key: "archive", label: "Archive" },
];

export default function JunglePage() {
  const { user } = useAuth();
  const { plants, loading } = usePlants(user?.uid);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const today = new Date().toISOString().split("T")[0];

  const filtered = plants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.species ?? "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "archive") return p.status === "archived";
    // All other filters exclude archived plants
    if (p.status === "archived") return false;
    if (filter === "water") return p.nextWaterDate <= today;
    if (filter === "sick") return p.status === "sick" || p.healthScore < 80;
    if (filter === "propagating") return p.status === "propagating";
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-brand-carbon">My Jungle</h1>
        <div className="flex gap-2">
          <Link href="/jungle/wishlist">
            <Button variant="outline" size="sm" className="rounded-[16px] gap-1.5 border-brand-card text-brand-carbon/70">
              <Star size={15} />
              <span className="hidden sm:inline">Wishlist</span>
            </Button>
          </Link>
          <Link href="/scanner">
            <Button variant="outline" size="icon" className="rounded-[16px]">
              <ScanLine size={18} />
            </Button>
          </Link>
          <Link href="/jungle/add">
            <Button className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] gap-2">
              <Plus size={18} />
              <span className="hidden sm:inline">AI Add Plant</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search plants…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 rounded-[16px]"
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            className={`rounded-[12px] gap-1.5 ${
              filter === key
                ? "bg-brand-green hover:bg-brand-green/90 text-white border-brand-green"
                : "border-brand-card text-brand-carbon/60"
            }`}
            onClick={() => setFilter(key)}
          >
            {key === "archive" && <Archive size={13} />}
            {label}
          </Button>
        ))}
      </div>

      {/* Grid or skeletons */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-[32px]" />
          ))}
        </div>
      ) : filter === "archive" && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="text-5xl">📦</span>
          <p className="text-brand-carbon/50 font-medium">No archived plants</p>
          <p className="text-brand-carbon/30 text-sm">Plants you archive will appear here.</p>
        </div>
      ) : (
        <PlantGrid plants={filtered} />
      )}
    </div>
  );
}
