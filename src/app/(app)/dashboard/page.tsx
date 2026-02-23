"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePlants } from "@/hooks/use-plants";
import { useQuests } from "@/hooks/use-quests";
import { PlantGrid } from "@/components/plants/PlantGrid";
import { ClimateWidget } from "@/components/dashboard/ClimateWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  ScanLine,
  MessageCircle,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Cloud,
  MapPin,
  Droplets,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { fetchWeather, getWeatherEmoji, WeatherData } from "@/lib/weather";
import { callAiFlow } from "@/lib/ai-client";


// ── Type definitions ────────────────────────────────────────────────────────

interface RiskItem {
  risk: string;
  probability: "low" | "medium" | "high";
  timeframe: string;
  prevention: string;
}

interface PredictionOutput {
  overallOutlook: "thriving" | "stable" | "monitor" | "at_risk";
  risks: RiskItem[];
  repottingRisk: {
    needed: boolean;
    timeline: string;
  };
  pestRisk: {
    level: "low" | "medium" | "high";
    mostLikelyPest?: string;
    preventionTip: string;
  };
  nextMilestone: string;
  summary: string;
}

interface WeeklyReportOutput {
  headline: string;
  highlights: string[];
  concerns: string[];
  topTip: string;
  encouragement: string;
  plantOfTheWeek?: string;
}

interface WeatherAdjOutput {
  summary: string;
  adjustments: Array<{
    category: "watering" | "humidity" | "light" | "temperature" | "general";
    adjustment: string;
    reason: string;
    urgency: "low" | "medium" | "high";
  }>;
  tip: string;
  indoor_humidity_advice: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const outlookConfig = {
  thriving: { label: "Thriving", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  stable:   { label: "Stable",   className: "bg-blue-100 text-blue-700 border-blue-200" },
  monitor:  { label: "Monitor",  className: "bg-amber-100 text-amber-700 border-amber-200" },
  at_risk:  { label: "At Risk",  className: "bg-rose-100 text-rose-700 border-rose-200" },
};

const probabilityConfig = {
  low:    "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high:   "bg-rose-100 text-rose-700",
};

const categoryEmoji: Record<string, string> = {
  watering:    "💧",
  humidity:    "💦",
  light:       "☀️",
  temperature: "🌡️",
  general:     "📋",
};

const urgencyDot: Record<string, string> = {
  high:   "bg-red-400",
  medium: "bg-amber-400",
  low:    "bg-brand-green",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { plants, loading: plantsLoading } = usePlants(user?.uid);
  const { overdue, todayQuests, loading: questsLoading } = useQuests(user?.uid);

  // Health prediction state
  const [prediction, setPrediction] = useState<PredictionOutput | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionPlantName, setPredictionPlantName] = useState<string | null>(null);

  // Weekly report state
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportOutput | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // Weather & care adjustments state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherAdj, setWeatherAdj] = useState<WeatherAdjOutput | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [adjExpanded, setAdjExpanded] = useState(false);

  const sickPlants = plants.filter(
    (p) => p.status === "sick" || p.healthScore < 80
  );
  const avgHealth =
    plants.length > 0
      ? Math.round(
          plants.reduce((sum, p) => sum + p.healthScore, 0) / plants.length
        )
      : 0;

  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const totalQuests = overdue.length + todayQuests.length;

  // Pick the sickest plant (lowest healthScore) for the prediction
  const targetPlant =
    plants.length > 0
      ? plants.reduce((prev, cur) =>
          cur.healthScore < prev.healthScore ? cur : prev
        )
      : null;

  async function handleGeneratePrediction() {
    if (!targetPlant) return;
    setPrediction(null);
    setPredictionError(null);
    setPredictionLoading(true);
    setPredictionPlantName(targetPlant.name);
    try {
      const data = await callAiFlow<PredictionOutput>("health-prediction", {
        plantName: targetPlant.name,
        species: targetPlant.species,
        healthScore: targetPlant.healthScore,
        status: targetPlant.status,
        wateringFrequencyDays: targetPlant.careProfile.wateringFrequencyDays,
        sunlight: targetPlant.careProfile.sunlight,
        humidity: targetPlant.careProfile.humidity,
      });
      setPrediction(data);
    } catch (err) {
      setPredictionError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPredictionLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (plants.length === 0) return;
    setWeeklyReport(null);
    setReportError(null);
    setReportLoading(true);
    setReportOpen(true);
    try {
      const data = await callAiFlow<WeeklyReportOutput>("weekly-report", {
        userName: user?.displayName ?? "Plant Parent",
        plants: plants.map((p) => ({
          name: p.name,
          healthScore: p.healthScore,
          status: p.status,
        })),
        streak: 0,
        level: 1,
      });
      setWeeklyReport(data);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setReportLoading(false);
    }
  }

  const loadWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const w = await fetchWeather();
      setWeather(w);
      // Then get AI adjustments
      const adj = await callAiFlow<WeatherAdjOutput>("weather-adjustment", {
        temperature: w.temperature,
        humidity: w.humidity,
        precipitation: w.precipitation,
        weatherDescription: w.weatherDescription,
        season: w.season,
        plantCount: plants.length,
      });
      setWeatherAdj(adj);
      setAdjExpanded(true);
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Failed to load weather");
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        {plantsLoading ? (
          <>
            <Skeleton className="h-9 w-64 rounded-[12px] mb-2" />
            <Skeleton className="h-4 w-40 rounded-[12px]" />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-brand-carbon">
              {getGreeting()}, {firstName} 🌿
            </h1>
            <p className="text-sm text-brand-carbon/60 mt-1">
              {plants.length === 0
                ? "Start building your jungle"
                : `${plants.length} plant${plants.length !== 1 ? "s" : ""} · Jungle health ${avgHealth}%`}
            </p>
          </>
        )}
      </div>

      {/* Weather & Plant Care widget */}
      <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 mb-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg select-none">🌤️</span>
            <p className="font-bold text-brand-carbon text-sm">Weather &amp; Care</p>
          </div>
          <div className="flex items-center gap-2">
            {weather && (
              <span className="text-xs text-brand-carbon/40 flex items-center gap-1">
                <MapPin size={11} />
                Local
              </span>
            )}
            {(weather || weatherError) && (
              <button
                onClick={loadWeather}
                disabled={weatherLoading}
                className="text-brand-carbon/40 hover:text-brand-carbon transition-colors disabled:opacity-40"
                aria-label="Refresh weather"
              >
                <RefreshCw size={14} className={weatherLoading ? "animate-spin" : ""} />
              </button>
            )}
          </div>
        </div>

        {/* Idle state — no weather loaded yet */}
        {!weather && !weatherLoading && !weatherError && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-xs text-brand-carbon/50">
              Allow location access to get personalized care tips based on your local weather.
            </p>
            <button
              onClick={loadWeather}
              className="inline-flex items-center gap-1.5 bg-brand-green text-white text-xs font-semibold px-4 py-2 rounded-[12px] hover:bg-brand-green/90 transition-colors"
            >
              <MapPin size={13} />
              Get Location
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {weatherLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-card/50 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 rounded-[8px] bg-brand-card/50 animate-pulse" />
                <div className="h-3 w-36 rounded-[8px] bg-brand-card/50 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="h-3 w-full rounded-[8px] bg-brand-card/50 animate-pulse" />
              <div className="h-3 w-5/6 rounded-[8px] bg-brand-card/50 animate-pulse" />
              <div className="h-3 w-4/5 rounded-[8px] bg-brand-card/50 animate-pulse" />
            </div>
            <p className="text-xs text-brand-carbon/40 mt-1">
              Fetching weather &amp; generating care tips…
            </p>
          </div>
        )}

        {/* Error state */}
        {weatherError && !weatherLoading && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-xs text-rose-500">
              {weatherError.includes("denied") || weatherError.includes("User denied") || weatherError.includes("1")
                ? "Location access required for weather tips. Please allow location in your browser."
                : weatherError}
            </p>
            <button
              onClick={loadWeather}
              className="inline-flex items-center gap-1.5 border border-brand-card text-brand-carbon text-xs font-semibold px-3 py-1.5 rounded-[12px] hover:bg-brand-card/30 transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        {/* Weather data loaded */}
        {weather && !weatherLoading && (
          <div className="space-y-4">
            {/* Weather row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-4xl select-none leading-none">
                {getWeatherEmoji(weather.weatherCode)}
              </span>
              <div>
                <p className="text-2xl font-extrabold text-brand-carbon leading-none">
                  {weather.temperature}°F
                </p>
                <p className="text-xs text-brand-carbon/60 mt-0.5">
                  {weather.weatherDescription}
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <Droplets size={13} className="text-sky-400" />
                <span className="text-xs text-brand-carbon/60">{weather.humidity}% humidity</span>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-card/60 text-brand-carbon/70 capitalize">
                {weather.season}
              </span>
            </div>

            {/* AI Adjustments */}
            {weatherAdj && (
              <div className="space-y-3">
                {/* Summary */}
                <p className="text-xs text-brand-carbon/70 leading-relaxed">
                  {weatherAdj.summary}
                </p>

                {/* Toggle for adjustments */}
                <button
                  onClick={() => setAdjExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-green hover:underline"
                >
                  <Wind size={12} />
                  {adjExpanded ? "▴ Hide care tips" : "▾ Show care tips"}
                </button>

                {adjExpanded && (
                  <div className="space-y-2">
                    {/* Adjustment rows */}
                    {weatherAdj.adjustments.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-brand-card/20 rounded-[16px] px-3 py-2.5">
                        <span className="text-base select-none mt-0.5 leading-none">
                          {categoryEmoji[item.category] ?? "📋"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-brand-carbon leading-snug">
                            {item.adjustment}
                          </p>
                          <p className="text-[11px] text-brand-carbon/55 mt-0.5 leading-relaxed">
                            {item.reason}
                          </p>
                        </div>
                        <span
                          className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${urgencyDot[item.urgency]}`}
                          title={`${item.urgency} urgency`}
                        />
                      </div>
                    ))}

                    {/* Humidity advice */}
                    <div className="flex items-start gap-2 bg-sky-50 rounded-[16px] px-3 py-2.5">
                      <Droplets size={13} className="text-sky-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-brand-carbon/70 leading-relaxed">
                        {weatherAdj.indoor_humidity_advice}
                      </p>
                    </div>

                    {/* Tip callout */}
                    <div className="bg-brand-green/10 rounded-[16px] p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sun size={12} className="text-brand-green" />
                        <span className="text-[11px] font-semibold text-brand-green uppercase tracking-wide">
                          Seasonal tip
                        </span>
                      </div>
                      <p className="text-xs text-brand-carbon leading-relaxed">
                        {weatherAdj.tip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI still loading after weather */}
            {!weatherAdj && (
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-[8px] bg-brand-card/50 animate-pulse" />
                <div className="h-3 w-4/5 rounded-[8px] bg-brand-card/50 animate-pulse" />
                <p className="text-[11px] text-brand-carbon/40 pt-0.5">Generating care tips…</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick actions row — includes Weekly Report card */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <Link href="/jungle/add">
            <Button className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] gap-2">
              <Plus size={18} /> AI Add Plant
            </Button>
          </Link>
          <Link href="/scanner">
            <Button variant="outline" className="rounded-[16px] gap-2 border-brand-card">
              <ScanLine size={18} /> Scanner
            </Button>
          </Link>
          <Link href="/buddy">
            <Button variant="outline" className="rounded-[16px] gap-2 border-brand-card">
              <MessageCircle size={18} /> Ask Buddy
            </Button>
          </Link>
        </div>

        {/* Weekly Report card */}
        {!plantsLoading && plants.length > 0 && (
          <div className="bg-gradient-to-br from-brand-purple to-brand-pink rounded-[32px] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Weekly Report</p>
                <p className="text-white/70 text-xs mt-0.5">
                  Your jungle summary
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="rounded-[12px] border-white/40 text-white bg-transparent hover:bg-white/10 gap-1.5 text-xs"
              >
                {reportLoading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <TrendingUp size={13} />
                )}
                {reportLoading ? "Generating…" : "Generate"}
              </Button>
            </div>

            {/* Report output */}
            {reportOpen && (
              <div className="mt-4 bg-white/10 rounded-[20px] p-4 text-white">
                {reportLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-[8px] bg-white/20" />
                    <Skeleton className="h-4 w-full rounded-[8px] bg-white/20" />
                    <Skeleton className="h-4 w-5/6 rounded-[8px] bg-white/20" />
                  </div>
                )}

                {reportError && (
                  <p className="text-xs text-white/80">{reportError}</p>
                )}

                {weeklyReport && !reportLoading && (
                  <div className="space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-base leading-snug">
                        {weeklyReport.headline}
                      </p>
                      <button
                        onClick={() => {
                          setReportOpen(false);
                          setWeeklyReport(null);
                        }}
                        className="text-white/60 hover:text-white shrink-0 mt-0.5"
                        aria-label="Close report"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Plant of the week */}
                    {weeklyReport.plantOfTheWeek && (
                      <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                        <Sparkles size={11} />
                        Plant of the week: {weeklyReport.plantOfTheWeek}
                      </div>
                    )}

                    {/* Highlights */}
                    {weeklyReport.highlights.length > 0 && (
                      <ul className="space-y-1">
                        {weeklyReport.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle
                              size={13}
                              className="text-emerald-300 mt-0.5 shrink-0"
                            />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Concerns */}
                    {weeklyReport.concerns.length > 0 && (
                      <ul className="space-y-1">
                        {weeklyReport.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <AlertTriangle
                              size={13}
                              className="text-amber-300 mt-0.5 shrink-0"
                            />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Top tip callout */}
                    <div className="bg-white/20 rounded-[12px] p-3">
                      <p className="text-xs font-semibold mb-0.5">
                        Tip for this week
                      </p>
                      <p className="text-xs leading-relaxed">
                        {weeklyReport.topTip}
                      </p>
                    </div>

                    {/* Encouragement */}
                    <p className="text-xs text-white/80 italic leading-relaxed">
                      {weeklyReport.encouragement}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Climate widget */}
      <div className="mb-4">
        <ClimateWidget />
      </div>

      {/* Sick Bay alert */}
      {!plantsLoading && sickPlants.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-[32px] p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg select-none">🏥</span>
            <p className="text-sm font-bold text-rose-500">Sick Bay</p>
          </div>
          <p className="text-sm text-brand-carbon/80">
            {sickPlants.length} plant{sickPlants.length !== 1 ? "s" : ""} need
            attention:{" "}
            <span className="font-semibold">
              {sickPlants.map((p) => p.name).join(", ")}
            </span>
          </p>
        </div>
      )}

      {/* AI Health Predictions */}
      {!plantsLoading && plants.length > 0 && (
        <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 mb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-purple" />
              <p className="font-bold text-brand-carbon text-sm">
                AI Predictions
              </p>
            </div>
            <div className="flex items-center gap-2">
              {prediction && (
                <button
                  onClick={() => {
                    setPrediction(null);
                    setPredictionError(null);
                    handleGeneratePrediction();
                  }}
                  className="text-brand-carbon/40 hover:text-brand-carbon transition-colors"
                  aria-label="Refresh prediction"
                >
                  <RefreshCw size={14} />
                </button>
              )}
              {!prediction && !predictionLoading && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGeneratePrediction}
                  className="rounded-[12px] border-brand-card text-xs h-7 px-3 gap-1.5"
                >
                  <Sparkles size={12} />
                  Generate
                </Button>
              )}
            </div>
          </div>

          {/* Idle state */}
          {!prediction && !predictionLoading && !predictionError && (
            <p className="text-xs text-brand-carbon/50">
              Analyze{" "}
              <span className="font-medium text-brand-carbon/70">
                {targetPlant?.name}
              </span>{" "}
              for upcoming health risks and care predictions.
            </p>
          )}

          {/* Loading skeleton */}
          {predictionLoading && (
            <div className="space-y-2 mt-1">
              <Skeleton className="h-4 w-1/3 rounded-[8px]" />
              <Skeleton className="h-3 w-full rounded-[8px]" />
              <Skeleton className="h-3 w-4/5 rounded-[8px]" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          )}

          {/* Error */}
          {predictionError && !predictionLoading && (
            <p className="text-xs text-rose-500 mt-1">{predictionError}</p>
          )}

          {/* Prediction result */}
          {prediction && !predictionLoading && (
            <div className="space-y-3 mt-1">
              {/* Plant name + outlook */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-brand-carbon/50">
                  Prediction for:{" "}
                  <span className="font-semibold text-brand-carbon/80">
                    {predictionPlantName}
                  </span>
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                    outlookConfig[prediction.overallOutlook].className
                  }`}
                >
                  {outlookConfig[prediction.overallOutlook].label}
                </Badge>
              </div>

              {/* Top 2 risks */}
              {prediction.risks.slice(0, 2).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {prediction.risks.slice(0, 2).map((r, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        probabilityConfig[r.probability]
                      }`}
                    >
                      <AlertTriangle size={11} />
                      {r.risk}
                      <span className="opacity-70">· {r.probability}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Repotting + Pest risk grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-brand-card/30 rounded-[16px] p-2.5">
                  <p className="text-[10px] font-semibold text-brand-carbon/50 uppercase tracking-wide mb-1">
                    Repotting
                  </p>
                  <p className="text-xs font-semibold text-brand-carbon">
                    {prediction.repottingRisk.needed ? "Needed soon" : "Not soon"}
                  </p>
                  <p className="text-[10px] text-brand-carbon/60 mt-0.5">
                    {prediction.repottingRisk.timeline}
                  </p>
                </div>
                <div className="bg-brand-card/30 rounded-[16px] p-2.5">
                  <p className="text-[10px] font-semibold text-brand-carbon/50 uppercase tracking-wide mb-1">
                    Pest Risk
                  </p>
                  <p
                    className={`text-xs font-semibold capitalize ${
                      prediction.pestRisk.level === "high"
                        ? "text-rose-600"
                        : prediction.pestRisk.level === "medium"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {prediction.pestRisk.level}
                    {prediction.pestRisk.mostLikelyPest
                      ? ` · ${prediction.pestRisk.mostLikelyPest}`
                      : ""}
                  </p>
                  <p className="text-[10px] text-brand-carbon/60 mt-0.5 line-clamp-2">
                    {prediction.pestRisk.preventionTip}
                  </p>
                </div>
              </div>

              {/* Next milestone */}
              <div className="flex items-center gap-1.5 text-xs text-brand-carbon/70">
                <TrendingUp size={12} className="text-brand-green shrink-0" />
                <span>{prediction.nextMilestone}</span>
              </div>

              {/* Summary */}
              <p className="text-xs text-brand-carbon/60 leading-relaxed">
                {prediction.summary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quest summary */}
      {!questsLoading && totalQuests > 0 && (
        <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 mb-6">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-brand-carbon text-sm">
              Today&apos;s Quests
            </p>
            <Link
              href="/quests"
              className="text-xs text-brand-green font-semibold hover:underline"
            >
              See all
            </Link>
          </div>
          <p className="text-sm text-brand-carbon/60">
            {overdue.length > 0 && (
              <span className="text-rose-500 font-semibold">
                {overdue.length} overdue ·{" "}
              </span>
            )}
            {todayQuests.length} due today
          </p>
        </div>
      )}

      {/* Plant grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-carbon">My Jungle</h2>
          {plants.length > 0 && (
            <Link
              href="/jungle"
              className="text-xs text-brand-green font-semibold hover:underline"
            >
              See all
            </Link>
          )}
        </div>
        {plantsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[32px]" />
            ))}
          </div>
        ) : (
          <PlantGrid plants={plants.slice(0, 8)} />
        )}
      </div>
    </div>
  );
}
