"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Star, X } from "lucide-react";

export const dynamic = "force-dynamic";

interface WishlistItem {
  id: string;
  name: string;
  species?: string;
  notes?: string;
  addedAt: string;
}

const STORAGE_KEY = "bloomie-wishlist";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSpecies, setFormSpecies] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const newItem: WishlistItem = {
      id: nanoid(),
      name: formName.trim(),
      species: formSpecies.trim() || undefined,
      notes: formNotes.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
    setFormName("");
    setFormSpecies("");
    setFormNotes("");
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/jungle")}
        className="flex items-center gap-2 text-brand-carbon/60 mb-6 text-sm hover:text-brand-carbon transition-colors"
      >
        <ArrowLeft size={16} /> Back to My Jungle
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-brand-carbon">My Wishlist</h1>
          <Star size={24} className="text-brand-orange fill-brand-orange" />
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add to Wishlist</span>
        </Button>
      </div>

      {/* Inline Add Form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 mb-6 flex flex-col gap-3"
        >
          <p className="font-bold text-brand-carbon text-sm">New Wishlist Plant</p>
          <Input
            placeholder="Plant name (required)"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="rounded-[16px]"
            required
          />
          <Input
            placeholder="Species (optional)"
            value={formSpecies}
            onChange={(e) => setFormSpecies(e.target.value)}
            className="rounded-[16px]"
          />
          <textarea
            placeholder="Notes (optional)"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            rows={3}
            className="w-full border border-brand-carbon/10 rounded-[16px] px-4 py-3 text-sm text-brand-carbon placeholder:text-brand-carbon/30 resize-none focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!formName.trim()}
              className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] flex-1"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px] border-brand-card text-brand-carbon/60 flex-1"
              onClick={() => {
                setShowForm(false);
                setFormName("");
                setFormSpecies("");
                setFormNotes("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="text-5xl">🌿</span>
          <p className="text-brand-carbon/50 font-medium">Your wishlist is empty.</p>
          <p className="text-brand-carbon/30 text-sm">Spot a plant you love? Add it here!</p>
        </div>
      )}

      {/* Wishlist items */}
      {items.length > 0 && (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brand-carbon truncate">{item.name}</p>
                {item.species && (
                  <p className="text-sm text-brand-carbon/40 italic truncate">{item.species}</p>
                )}
                {item.notes && (
                  <p className="text-sm text-brand-carbon/50 mt-1 leading-relaxed">{item.notes}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-brand-carbon/30 hover:text-red-400 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <X size={18} />
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-[12px] border-brand-green text-brand-green hover:bg-brand-green/10 text-xs"
                  onClick={() =>
                    router.push(`/jungle/add?wishlist=${encodeURIComponent(item.name)}`)
                  }
                >
                  AI Add to Jungle
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
