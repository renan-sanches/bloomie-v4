"use client";

import { useState } from "react";
import { BookOpen, Play, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";


// ─── Data ────────────────────────────────────────────────────────────────────

const videos = [
  {
    id: "1",
    title: "How to Water Like a Pro",
    duration: "4:32",
    thumbnail: "💧",
    category: "Watering",
    description:
      "Master the art of watering: bottom-watering, deep watering, and how to tell when your plant is thirsty.",
  },
  {
    id: "2",
    title: "Diagnosing Yellow Leaves",
    duration: "6:15",
    thumbnail: "🍂",
    category: "Diagnosis",
    description:
      "Yellow leaves can mean many things — learn how to diagnose overwatering, underwatering, and nutrient deficiency.",
  },
  {
    id: "3",
    title: "Repotting 101",
    duration: "8:44",
    thumbnail: "🪴",
    category: "Repotting",
    description:
      "Know when and how to repot your plants for healthy root growth.",
  },
  {
    id: "4",
    title: "Propagation Guide",
    duration: "7:21",
    thumbnail: "✂️",
    category: "Propagation",
    description:
      "From stem cuttings to water propagation — grow your jungle for free.",
  },
  {
    id: "5",
    title: "Understanding Light",
    duration: "5:10",
    thumbnail: "☀️",
    category: "Light",
    description:
      "Direct, indirect, low light — demystified. Find the perfect spot for every plant.",
  },
  {
    id: "6",
    title: "Fertilizing Basics",
    duration: "3:55",
    thumbnail: "🌱",
    category: "Fertilizing",
    description:
      "When to fertilize, what to use, and how to avoid over-feeding your plants.",
  },
];

const tips = [
  {
    id: "1",
    title: "The 5 Signs Your Plant Needs More Light",
    readTime: "3 min read",
    tag: "Light",
    emoji: "☀️",
    excerpt:
      "Leggy growth, small leaves, and pale color are all signs your plant is stretching toward the sun.",
  },
  {
    id: "2",
    title: "Why Misting Doesn't Actually Raise Humidity",
    readTime: "4 min read",
    tag: "Humidity",
    emoji: "💦",
    excerpt:
      "Contrary to popular belief, misting provides only a brief humidity boost. Here's what actually works.",
  },
  {
    id: "3",
    title: "Seasonal Care: Adjusting Your Routine in Winter",
    readTime: "5 min read",
    tag: "Seasonal",
    emoji: "❄️",
    excerpt:
      "Your plants slow down in winter — your care routine should too. Less water, no fertilizer, move away from drafts.",
  },
  {
    id: "4",
    title: "The Best Soil Mixes for Common Houseplants",
    readTime: "6 min read",
    tag: "Soil",
    emoji: "🪨",
    excerpt:
      "Aroid mix, cactus mix, or regular potting soil? The right medium makes all the difference.",
  },
];

const glossaryTerms = [
  {
    term: "Bright Indirect Light",
    definition:
      "Light that is filtered through a sheer curtain or bounced off walls. No direct sun hits the leaves. Ideal for most tropical houseplants.",
  },
  {
    term: "Bottom Watering",
    definition:
      "Placing a pot in a tray of water and allowing soil to absorb moisture from the drainage holes upward. Encourages deep root growth and prevents overwatering.",
  },
  {
    term: "Aroid",
    definition:
      "A plant family (Araceae) that includes Monstera, Pothos, Philodendron, and Peace Lily. Typically loves humidity and indirect light.",
  },
  {
    term: "Root Bound",
    definition:
      "When a plant's roots have filled its pot and are circling or emerging from drainage holes. Time to repot!",
  },
  {
    term: "Perlite",
    definition:
      "A white volcanic mineral added to soil to improve drainage and aeration. Prevents compaction and root rot.",
  },
  {
    term: "Etiolation",
    definition:
      "When a plant grows tall, thin, and pale due to insufficient light as it stretches toward a light source.",
  },
  {
    term: "Photosynthesis",
    definition:
      "The process by which plants convert light energy into sugars using CO₂ and water. The foundation of all plant growth.",
  },
  {
    term: "Transpiration",
    definition:
      "The process of water movement through a plant and its evaporation from leaves. Higher humidity = less water loss.",
  },
  {
    term: "Fungus Gnats",
    definition:
      "Tiny flies that breed in moist soil. Larvae feed on roots. Let soil dry between waterings to discourage them.",
  },
  {
    term: "Variegation",
    definition:
      "Patches of white, yellow, or cream on leaves caused by lack of chlorophyll in certain cells. Often highly prized by collectors.",
  },
  {
    term: "Dormancy",
    definition:
      "A period of rest, usually in winter, when plant growth slows significantly. Reduce watering and stop fertilizing.",
  },
  {
    term: "Aerial Roots",
    definition:
      "Roots that grow above the soil, commonly on Monstera and Pothos. In the wild they anchor the plant to trees.",
  },
];

const GLOSSARY_FILTERS = ["All", "Light", "Water", "Soil", "Pests", "Growth"] as const;
type GlossaryFilter = (typeof GLOSSARY_FILTERS)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function VideoCard({ video }: { video: (typeof videos)[number] }) {
  return (
    <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="bg-brand-card aspect-video flex items-center justify-center text-5xl select-none">
        {video.thumbnail}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-brand-green/10 text-brand-green rounded-[12px] text-xs px-2 py-0.5 font-medium">
            {video.category}
          </span>
          <span className="text-xs text-brand-carbon/40 ml-auto">{video.duration}</span>
        </div>

        <p className="font-bold text-brand-carbon text-sm leading-snug">{video.title}</p>
        <p className="text-sm text-brand-carbon/50 line-clamp-2 flex-1">{video.description}</p>

        <Button
          variant="outline"
          className="rounded-[16px] gap-2 border-brand-card mt-1 w-full text-sm"
          onClick={() => window.alert("Video coming soon! 🎬")}
        >
          <Play size={14} />
          Watch
        </Button>
      </div>
    </div>
  );
}

function TipCard({ tip }: { tip: (typeof tips)[number] }) {
  return (
    <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl select-none">{tip.emoji}</span>
        <span className="bg-brand-green/10 text-brand-green rounded-[12px] text-xs px-2 py-0.5 font-medium whitespace-nowrap">
          {tip.tag}
        </span>
      </div>

      <p className="font-bold text-brand-carbon text-sm leading-snug">{tip.title}</p>
      <p className="text-sm text-brand-carbon/50 line-clamp-3 flex-1">{tip.excerpt}</p>

      <div className="flex items-center justify-between mt-1 gap-2">
        <span className="text-xs text-brand-carbon/40">{tip.readTime}</span>
        <Button
          variant="outline"
          className="rounded-[16px] gap-1.5 border-brand-card text-xs h-8 px-3"
          onClick={() => window.alert("Article coming soon! 📖")}
        >
          <BookOpen size={12} />
          Read
        </Button>
      </div>
    </div>
  );
}

function GlossaryItem({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: (typeof glossaryTerms)[number];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const preview = entry.definition.length > 60
    ? entry.definition.slice(0, 60) + "…"
    : entry.definition;

  return (
    <div
      className="bg-white rounded-[24px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 cursor-pointer select-none"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-carbon text-sm">{entry.term}</p>
          {!isExpanded && (
            <p className="text-xs text-brand-carbon/50 mt-0.5 truncate">{preview}</p>
          )}
          {isExpanded && (
            <p className="text-sm text-brand-carbon/70 mt-1.5 leading-relaxed">
              {entry.definition}
            </p>
          )}
        </div>
        <span className="text-brand-carbon/40 shrink-0">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const [glossarySearch, setGlossarySearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<GlossaryFilter>("All");
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filterKeywordMap: Record<GlossaryFilter, string> = {
    All: "",
    Light: "light",
    Water: "water",
    Soil: "soil",
    Pests: "pest",
    Growth: "grow",
  };

  const filteredGlossary = glossaryTerms.filter((entry) => {
    const query = glossarySearch.toLowerCase();
    const matchesSearch =
      query === "" ||
      entry.term.toLowerCase().includes(query) ||
      entry.definition.toLowerCase().includes(query);

    const keyword = filterKeywordMap[activeFilter];
    const matchesFilter =
      activeFilter === "All" ||
      entry.term.toLowerCase().includes(keyword) ||
      entry.definition.toLowerCase().includes(keyword);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-carbon">Learn 📚</h1>
        <p className="text-brand-carbon/50 text-sm mt-1">Grow your plant knowledge</p>
      </div>

      {/* ── Section 1: Video Library ── */}
      <section>
        <h2 className="text-lg font-bold text-brand-carbon mb-1">Video Library</h2>
        <p className="text-sm text-brand-carbon/50 mb-4">
          Short, practical plant care guides
        </p>

        {/* Mobile: horizontal scroll / Desktop: 3-col grid */}
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {videos.map((video) => (
            <div
              key={video.id}
              className="min-w-[240px] snap-start md:min-w-0 flex flex-col"
            >
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Tips / Blog Feed ── */}
      <section>
        <h2 className="text-lg font-bold text-brand-carbon mb-1">Plant Care Tips</h2>
        <p className="text-sm text-brand-carbon/50 mb-4">
          Articles to level up your green thumb
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      </section>

      {/* ── Section 3: Glossary ── */}
      <section>
        <h2 className="text-lg font-bold text-brand-carbon mb-1">Glossary</h2>
        <p className="text-sm text-brand-carbon/50 mb-4">
          Plant terms, plain and simple
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-carbon/40 pointer-events-none"
          />
          <Input
            placeholder="Search the glossary..."
            value={glossarySearch}
            onChange={(e) => {
              setGlossarySearch(e.target.value);
              setExpandedTerm(null);
            }}
            className="pl-9 rounded-[16px] border-brand-card bg-white focus-visible:ring-brand-green/40"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-4">
          {GLOSSARY_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setExpandedTerm(null);
              }}
              className={[
                "text-xs font-medium px-3 py-1 rounded-[12px] transition-colors",
                activeFilter === filter
                  ? "bg-brand-green text-white"
                  : "bg-brand-card text-brand-carbon/60 hover:bg-brand-green/10 hover:text-brand-green",
              ].join(" ")}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Terms */}
        <div className="flex flex-col gap-2">
          {filteredGlossary.length === 0 ? (
            <div className="text-center py-10 text-brand-carbon/40 text-sm">
              No terms found. Try a different search.
            </div>
          ) : (
            filteredGlossary.map((entry) => (
              <GlossaryItem
                key={entry.term}
                entry={entry}
                isExpanded={expandedTerm === entry.term}
                onToggle={() =>
                  setExpandedTerm(
                    expandedTerm === entry.term ? null : entry.term
                  )
                }
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
