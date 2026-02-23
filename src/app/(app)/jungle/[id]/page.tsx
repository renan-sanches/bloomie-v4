"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getDocs, orderBy, query } from "firebase/firestore";
import { nanoid } from "nanoid";
import { useAuth } from "@/contexts/AuthContext";
import { getPlant, historyRef, addHistoryEntry, setPlant, deletePlant } from "@/lib/firestore";
import { CareHistoryTimeline } from "@/components/plants/CareHistoryTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Droplets,
  Sun,
  Thermometer,
  ArrowLeft,
  Sprout,
  Wind,
  Sparkles,
  Phone,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  MoreVertical,
  Archive,
  Trash2,
} from "lucide-react";
import type { Plant, CareHistoryEntry } from "@/types";
import { callAiFlow } from "@/lib/ai-client";

const statusStyles: Record<Plant["status"], string> = {
  healthy: "bg-brand-green/10 text-brand-green",
  attention: "bg-amber-50 text-amber-600",
  sick: "bg-red-50 text-red-500",
  propagating: "bg-purple-50 text-purple-600",
  archived: "bg-brand-card text-brand-carbon/40",
};

type LivingPortrait = {
  scene: string;
  animationStyle: "sway" | "breathe" | "shimmer";
  mood: string;
};

type PlantCall = {
  greeting: string;
  personality: string;
  responses: {
    howAreYou: string;
    doYouNeedAnything: string;
    iLoveYou: string;
  };
  mood: string;
};

type CarePlanStep = {
  day: number;
  action: string;
  materials?: string;
};

type CarePlanCheckpoint = {
  day: number;
  prompt: string;
  photoRequired: boolean;
};

type CarePlan = {
  title: string;
  estimatedDays: number;
  steps: CarePlanStep[];
  checkpoints: CarePlanCheckpoint[];
  expectedSigns: string[];
  warningSigns: string[];
  materials: string[];
};

function speak(text: string) {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utt);
  }
}

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [plant, setPlantState] = useState<Plant | null>(null);
  const [history, setHistory] = useState<CareHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [caring, setCaring] = useState(false);

  // AI state
  const [livingPortrait, setLivingPortrait] = useState<LivingPortrait | null>(null);
  const [plantCall, setPlantCall] = useState<PlantCall | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [aiLoading, setAiLoading] = useState<"portrait" | "call" | "careplan" | null>(null);
  const [showPortrait, setShowPortrait] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [callResponse, setCallResponse] = useState<string | null>(null);
  const [carePlanIssue, setCarePlanIssue] = useState("");
  const [carePlanSeverity, setCarePlanSeverity] = useState<"mild" | "moderate" | "severe">("mild");
  const [showCarePlanForm, setShowCarePlanForm] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState(false);

  const handleArchivePlant = async () => {
    if (!user || !plant) return;
    await setPlant(user.uid, plant.id, { status: "archived" });
    setArchiveSuccess(true);
    setTimeout(() => router.push("/jungle"), 1500);
  };

  const handleDeletePlant = async () => {
    if (!user || !plant) return;
    const confirmed = window.confirm("Are you sure? This cannot be undone.");
    if (!confirmed) return;
    await deletePlant(user.uid, plant.id);
    router.push("/jungle");
  };

  const loadPlant = useCallback(async () => {
    if (!user || !id) return;
    const snap = await getPlant(user.uid, id);
    if (snap.exists()) {
      setPlantState({ id: snap.id, ...snap.data() } as Plant);
    }
    const histSnap = await getDocs(
      query(historyRef(user.uid, id), orderBy("timestamp", "desc"))
    );
    setHistory(
      histSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CareHistoryEntry))
    );
    setLoading(false);
  }, [user, id]);

  useEffect(() => {
    loadPlant();
  }, [loadPlant]);

  const logCare = async (type: CareHistoryEntry["type"]) => {
    if (!user || !plant || caring) return;
    setCaring(true);
    try {
      const entry: Omit<CareHistoryEntry, "id"> = {
        plantId: plant.id,
        type,
        timestamp: new Date().toISOString(),
      };
      await addHistoryEntry(user.uid, plant.id, entry);

      const updates: Partial<Plant> = {};
      if (type === "water") {
        const next = new Date();
        next.setDate(next.getDate() + plant.careProfile.wateringFrequencyDays);
        updates.nextWaterDate = next.toISOString().split("T")[0];
      }
      if (Object.keys(updates).length > 0) {
        await setPlant(user.uid, plant.id, updates);
        setPlantState((prev) => (prev ? { ...prev, ...updates } : prev));
      }

      const newEntry: CareHistoryEntry = { id: nanoid(), ...entry };
      setHistory((h) => [newEntry, ...h]);
    } finally {
      setCaring(false);
    }
  };

  const handleGeneratePortrait = async () => {
    if (!plant) return;
    setAiLoading("portrait");
    setAiError(null);
    try {
      const data = await callAiFlow<LivingPortrait>("generate-living-portrait", {
        plantName: plant.name,
        species: plant.species,
      });
      setLivingPortrait(data as LivingPortrait);
      setShowPortrait(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(null);
    }
  };

  const handleCallPlant = async () => {
    if (!plant) return;
    setAiLoading("call");
    setAiError(null);
    try {
      const data = await callAiFlow<PlantCall>("call-plant", {
        plantName: plant.name,
        species: plant.species,
        healthScore: plant.healthScore,
      });
      setPlantCall(data as PlantCall);
      setCallResponse(null);
      setShowCall(true);
      setTimeout(() => speak(data.greeting), 300);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(null);
    }
  };

  const handleGenerateCarePlan = async () => {
    if (!plant || !carePlanIssue.trim()) return;
    setAiLoading("careplan");
    setAiError(null);
    try {
      const data = await callAiFlow<CarePlan>("generate-care-plan", {
        plantName: plant.name,
        issue: carePlanIssue,
        severity: carePlanSeverity,
      });
      setCarePlan(data as CarePlan);
      setShowCarePlanForm(false);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(null);
    }
  };

  const handleCallResponse = (text: string, key: "howAreYou" | "doYouNeedAnything" | "iLoveYou") => {
    if (!plantCall) return;
    const response = plantCall.responses[key];
    setCallResponse(response);
    speak(response);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-32 rounded-[12px]" />
        <Skeleton className="aspect-video rounded-[32px]" />
        <Skeleton className="h-6 w-48 rounded-[12px]" />
        <Skeleton className="h-4 w-full rounded-[12px]" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="p-6 text-center">
        <p className="text-brand-carbon/40">Plant not found.</p>
        <Button
          variant="outline"
          className="mt-4 rounded-[16px]"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (archiveSuccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Archive size={48} className="text-brand-carbon/30" />
        <p className="text-xl font-bold text-brand-carbon">Plant Archived</p>
        <p className="text-brand-carbon/50 text-sm">Redirecting to your jungle…</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand-carbon/60 text-sm hover:text-brand-carbon transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-[16px] border-brand-card">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-[16px] min-w-[180px]">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={handleArchivePlant}
            >
              <Archive size={16} className="text-brand-carbon/50" />
              Archive Plant
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
              onClick={handleDeletePlant}
            >
              <Trash2 size={16} />
              Delete Plant
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hero photo */}
      <div className="bg-[#2C3E2F] rounded-[32px] overflow-hidden aspect-video mb-6 flex items-center justify-center relative">
        {plant.photoUrl ? (
          <Image
            src={plant.photoUrl}
            alt={plant.name}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        ) : (
          <span className="text-8xl select-none">🌿</span>
        )}
      </div>

      {/* Name + status */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-carbon">
            {plant.name}
          </h1>
          {plant.species && (
            <p className="text-sm text-brand-carbon/40 italic">{plant.species}</p>
          )}
        </div>
        <Badge
          className={`capitalize rounded-[12px] shrink-0 ${statusStyles[plant.status]}`}
        >
          {plant.status}
        </Badge>
      </div>

      {/* Health bar */}
      <div className="flex items-center gap-3 mb-6">
        <Progress value={plant.healthScore} className="h-3 flex-1" />
        <span className="text-sm font-bold text-brand-carbon">
          {plant.healthScore}%
        </span>
      </div>

      {/* Quick care buttons */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <Button
          size="sm"
          disabled={caring}
          className="bg-blue-400 hover:bg-blue-500 text-white rounded-[16px] gap-1.5"
          onClick={() => logCare("water")}
        >
          <Droplets size={16} /> Water
        </Button>
        <Button
          size="sm"
          disabled={caring}
          className="bg-teal-400 hover:bg-teal-500 text-white rounded-[16px] gap-1.5"
          onClick={() => logCare("mist")}
        >
          <Wind size={16} /> Mist
        </Button>
        <Button
          size="sm"
          disabled={caring}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-[16px] gap-1.5"
          onClick={() => logCare("fertilize")}
        >
          <Sprout size={16} /> Fertilize
        </Button>
      </div>

      {/* ── AI FEATURES ── */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-brand-carbon/40 uppercase tracking-wider mb-3">
          AI Features
        </h2>

        {aiError && (
          <div className="mb-3 bg-red-50 text-red-500 text-sm rounded-[16px] px-4 py-2">
            {aiError}
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {/* Bring to Life */}
          <div className="bg-gradient-to-br from-[#C8A9E8] to-[#F49FB1] rounded-[24px] p-4 flex flex-col gap-2 min-w-[200px] shrink-0">
            <Sparkles className="text-white" size={22} />
            <p className="text-white font-bold text-base leading-tight">Bring to Life</p>
            <p className="text-white/70 text-xs">Animate your plant</p>
            <button
              onClick={handleGeneratePortrait}
              disabled={aiLoading === "portrait"}
              className="mt-auto border border-white/60 text-white text-sm font-semibold rounded-[12px] px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading === "portrait" ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </button>
          </div>

          {/* Call Plant */}
          <div className="bg-gradient-to-br from-[#6DBE76] to-teal-400 rounded-[24px] p-4 flex flex-col gap-2 min-w-[200px] shrink-0">
            <Phone className="text-white" size={22} />
            <p className="text-white font-bold text-base leading-tight">Call Plant</p>
            <p className="text-white/70 text-xs">Talk to your plant</p>
            <button
              onClick={handleCallPlant}
              disabled={aiLoading === "call"}
              className="mt-auto border border-white/60 text-white text-sm font-semibold rounded-[12px] px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading === "call" ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                "Call"
              )}
            </button>
          </div>

          {/* Smart Care Plan */}
          <div className="bg-gradient-to-br from-[#FFB849] to-amber-400 rounded-[24px] p-4 flex flex-col gap-2 min-w-[200px] shrink-0">
            <Calendar className="text-white" size={22} />
            <p className="text-white font-bold text-base leading-tight">Care Plan</p>
            <p className="text-white/70 text-xs">AI recovery plan</p>
            <button
              onClick={() => setShowCarePlanForm((v) => !v)}
              className="mt-auto border border-white/60 text-white text-sm font-semibold rounded-[12px] px-3 py-1.5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              {showCarePlanForm ? "Cancel" : "Generate"}
            </button>
          </div>
        </div>

        {/* Care Plan Inline Form */}
        {showCarePlanForm && (
          <div className="mt-4 bg-white rounded-[24px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3">
            <p className="font-semibold text-brand-carbon text-sm">Describe the issue</p>
            <textarea
              value={carePlanIssue}
              onChange={(e) => setCarePlanIssue(e.target.value)}
              placeholder="e.g. yellowing leaves, root rot, pests..."
              className="w-full border border-brand-carbon/10 rounded-[16px] px-4 py-3 text-sm text-brand-carbon placeholder:text-brand-carbon/30 resize-none focus:outline-none focus:ring-2 focus:ring-[#FFB849]/40"
              rows={3}
            />
            <div className="flex gap-2 items-center">
              <label className="text-xs text-brand-carbon/50 shrink-0">Severity:</label>
              <select
                value={carePlanSeverity}
                onChange={(e) =>
                  setCarePlanSeverity(e.target.value as "mild" | "moderate" | "severe")
                }
                className="border border-brand-carbon/10 rounded-[12px] px-3 py-1.5 text-sm text-brand-carbon focus:outline-none"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <Button
              onClick={handleGenerateCarePlan}
              disabled={!carePlanIssue.trim() || aiLoading === "careplan"}
              className="bg-[#FFB849] hover:bg-amber-400 text-white rounded-[16px] gap-2"
            >
              {aiLoading === "careplan" ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate Plan"
              )}
            </Button>
          </div>
        )}

        {/* Care Plan Result */}
        {carePlan && (
          <div className="mt-4 bg-white rounded-[24px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-brand-carbon">{carePlan.title}</p>
              <Badge className="bg-amber-50 text-amber-600 rounded-[12px] shrink-0">
                ~{carePlan.estimatedDays} days
              </Badge>
            </div>

            {carePlan.materials.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-brand-carbon/40 uppercase tracking-wider mb-2">
                  Materials
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {carePlan.materials.map((m) => (
                    <span
                      key={m}
                      className="bg-amber-50 text-amber-700 text-xs rounded-[12px] px-2.5 py-1"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-brand-carbon/40 uppercase tracking-wider mb-2">
                Steps
              </p>
              <div className="flex flex-col gap-2">
                {carePlan.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-3 items-start bg-brand-bg rounded-[16px] px-4 py-3"
                  >
                    <span className="text-xs font-bold text-amber-500 shrink-0 mt-0.5">
                      Day {step.day}
                    </span>
                    <div>
                      <p className="text-sm text-brand-carbon">{step.action}</p>
                      {step.materials && (
                        <p className="text-xs text-brand-carbon/40 mt-0.5">
                          Needs: {step.materials}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {carePlan.checkpoints.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-brand-carbon/40 uppercase tracking-wider mb-2">
                  Checkpoints
                </p>
                <div className="flex flex-col gap-2">
                  {carePlan.checkpoints.map((cp, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start bg-purple-50 rounded-[16px] px-4 py-3"
                    >
                      <span className="text-xs font-bold text-purple-500 shrink-0 mt-0.5">
                        Day {cp.day}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-brand-carbon">{cp.prompt}</p>
                      </div>
                      {cp.photoRequired && (
                        <Camera size={16} className="text-purple-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {carePlan.expectedSigns.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-brand-carbon/40 uppercase tracking-wider mb-2">
                  Signs of Improvement
                </p>
                <div className="flex flex-col gap-1">
                  {carePlan.expectedSigns.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-brand-green shrink-0" />
                      <p className="text-sm text-brand-carbon">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {carePlan.warningSigns.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-brand-carbon/40 uppercase tracking-wider mb-2">
                  Warning Signs
                </p>
                <div className="flex flex-col gap-1">
                  {carePlan.warningSigns.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <p className="text-sm text-brand-carbon">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs: Care Info / History */}
      <Tabs defaultValue="care">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="care" className="flex-1">
            Care Info
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="care">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Droplets size={18} className="text-blue-400" />,
                label: "Water every",
                value: `${plant.careProfile.wateringFrequencyDays} days`,
              },
              {
                icon: <Sun size={18} className="text-amber-400" />,
                label: "Sunlight",
                value: plant.careProfile.sunlight,
              },
              {
                icon: <Thermometer size={18} className="text-brand-green" />,
                label: "Temperature",
                value: `${plant.careProfile.tempMin}–${plant.careProfile.tempMax}°F`,
              },
              {
                icon: <Wind size={18} className="text-teal-400" />,
                label: "Humidity",
                value: plant.careProfile.humidity,
              },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 flex items-center gap-3"
              >
                <span>{icon}</span>
                <div>
                  <p className="text-xs text-brand-carbon/40">{label}</p>
                  <p className="text-sm font-semibold text-brand-carbon capitalize">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <CareHistoryTimeline entries={history} />
        </TabsContent>
      </Tabs>

      {/* ── Living Portrait Modal ── */}
      {showPortrait && livingPortrait && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <style>{`
            @keyframes sway {
              0%, 100% { transform: rotate(-2deg); }
              50% { transform: rotate(2deg); }
            }
            @keyframes breathe {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.04); }
            }
            @keyframes shimmer {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}</style>

          <button
            onClick={() => setShowPortrait(false)}
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors z-10"
          >
            <X size={28} />
          </button>

          <div className="flex flex-col items-center gap-6 px-6 max-w-sm w-full">
            <div
              className="w-full aspect-square rounded-[32px] overflow-hidden relative"
              style={{
                animation:
                  livingPortrait.animationStyle === "sway"
                    ? "sway 3s ease-in-out infinite"
                    : livingPortrait.animationStyle === "breathe"
                    ? "breathe 4s ease-in-out infinite"
                    : "shimmer 2s ease-in-out infinite",
              }}
            >
              {plant.photoUrl ? (
                <Image
                  src={plant.photoUrl}
                  alt={plant.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 384px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#2C3E2F] flex items-center justify-center">
                  <span className="text-8xl">🌿</span>
                </div>
              )}
            </div>

            <p className="text-white text-center italic text-base leading-relaxed">
              {livingPortrait.scene}
            </p>

            <Badge className="bg-white/20 text-white rounded-[12px] capitalize border-0">
              {livingPortrait.mood}
            </Badge>
          </div>
        </div>
      )}

      {/* ── Call Plant Modal ── */}
      {showCall && plantCall && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-brand-green font-bold text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse inline-block" />
                Connected
              </span>
              <button
                onClick={() => {
                  setShowCall(false);
                  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
                }}
                className="text-brand-carbon/40 hover:text-brand-carbon transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Avatar + info */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-green/20 shrink-0 relative">
                {plant.photoUrl ? (
                  <Image
                    src={plant.photoUrl}
                    alt={plant.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2C3E2F] flex items-center justify-center">
                    <span className="text-3xl">🌿</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="font-extrabold text-brand-carbon text-lg">{plant.name}</p>
                <Badge className="mt-1 bg-brand-purple/10 text-purple-600 rounded-[12px] text-xs capitalize border-0">
                  {plantCall.personality}
                </Badge>
              </div>
            </div>

            {/* Greeting / response bubble */}
            <div className="bg-brand-bg rounded-[20px] px-4 py-3 text-sm text-brand-carbon italic text-center">
              {callResponse ?? plantCall.greeting}
            </div>

            {/* Question buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCallResponse(plantCall.responses.howAreYou, "howAreYou")}
                className="w-full text-left text-sm px-4 py-2.5 rounded-[16px] bg-brand-bg hover:bg-brand-green/10 text-brand-carbon transition-colors"
              >
                How are you?
              </button>
              <button
                onClick={() =>
                  handleCallResponse(
                    plantCall.responses.doYouNeedAnything,
                    "doYouNeedAnything"
                  )
                }
                className="w-full text-left text-sm px-4 py-2.5 rounded-[16px] bg-brand-bg hover:bg-brand-green/10 text-brand-carbon transition-colors"
              >
                Do you need anything?
              </button>
              <button
                onClick={() => handleCallResponse(plantCall.responses.iLoveYou, "iLoveYou")}
                className="w-full text-left text-sm px-4 py-2.5 rounded-[16px] bg-brand-bg hover:bg-brand-pink/10 text-brand-carbon transition-colors"
              >
                I love you!
              </button>
            </div>

            {/* Hang up */}
            <Button
              onClick={() => {
                setShowCall(false);
                if (typeof window !== "undefined") window.speechSynthesis?.cancel();
              }}
              className="bg-red-400 hover:bg-red-500 text-white rounded-[16px] gap-2 w-full"
            >
              <Phone size={16} /> Hang Up
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
