"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { usePlants } from "@/hooks/use-plants";
import type { UserProfile } from "@/types";

// ---------------------------------------------------------------------------
// Achievement definitions
// ---------------------------------------------------------------------------
const ACHIEVEMENTS = [
  {
    id: "first_plant",
    icon: "🌱",
    title: "First Bloom",
    desc: "Added your first plant",
    xp: 10,
  },
  {
    id: "five_plants",
    icon: "🌿",
    title: "Growing Collection",
    desc: "Own 5 or more plants",
    xp: 25,
  },
  {
    id: "ten_plants",
    icon: "🌳",
    title: "Jungle King",
    desc: "Own 10 or more plants",
    xp: 50,
  },
  {
    id: "hydro_homie",
    icon: "💧",
    title: "Hydro Homie",
    desc: "Water a plant 10 times",
    xp: 20,
  },
  {
    id: "streak_7",
    icon: "🔥",
    title: "Week Warrior",
    desc: "Maintain a 7-day streak",
    xp: 30,
  },
  {
    id: "streak_30",
    icon: "🏆",
    title: "Plant Parent Pro",
    desc: "Maintain a 30-day streak",
    xp: 100,
  },
  {
    id: "scanner",
    icon: "🔍",
    title: "Plant Detective",
    desc: "Identify a plant with the scanner",
    xp: 15,
  },
  {
    id: "buddy",
    icon: "🤝",
    title: "Bloomie BFF",
    desc: "Chat with Bloomie Buddy",
    xp: 10,
  },
] as const;

// ---------------------------------------------------------------------------
// XP helpers
// ---------------------------------------------------------------------------
const xpForLevel = (lvl: number) => lvl * 100;

// ---------------------------------------------------------------------------
// Status bar chart colours
// ---------------------------------------------------------------------------
const STATUS_COLORS: Record<string, string> = {
  Healthy: "#6DBE76",
  Attention: "#FFB849",
  Sick: "#F49FB1",
  Propagating: "#C8A9E8",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Preferences local state (visual only)
  const [notifStyle, setNotifStyle] = useState<"gentle" | "strict">("gentle");
  const [waterStyle, setWaterStyle] = useState<"top" | "bottom">("top");

  // Load profile from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const defaultProfile: Partial<UserProfile> = {
      level: 1,
      xp: 0,
      streak: 0,
      achievements: [],
    };

    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<UserProfile>;
          setProfile({ ...defaultProfile, ...data });
          // Seed local prefs from stored preferences
          if (data.preferences?.notificationStyle) {
            setNotifStyle(data.preferences.notificationStyle);
          }
          if (data.preferences?.wateringStyle) {
            setWaterStyle(data.preferences.wateringStyle);
          }
        } else {
          setProfile(defaultProfile);
        }
      })
      .catch(() => {
        setProfile(defaultProfile);
      })
      .finally(() => setProfileLoading(false));
  }, [user?.uid]);

  const { plants } = usePlants(user?.uid);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const longestStreak = profile?.longestStreak ?? streak;

  const currentLevelXp = xp % xpForLevel(level);
  const xpToNext = xpForLevel(level) - currentLevelXp;
  const xpProgress = Math.round((currentLevelXp / xpForLevel(level)) * 100);

  const displayName =
    profile?.displayName ?? user?.displayName ?? user?.email ?? "Plant Parent";
  const email = profile?.email ?? user?.email ?? "";
  const avatarChar = displayName.charAt(0).toUpperCase();

  // ---------------------------------------------------------------------------
  // Achievement unlock logic
  // ---------------------------------------------------------------------------
  const unlockedIds = useMemo<Set<string>>(() => {
    const earned = new Set<string>(profile?.achievements ?? []);
    if (plants.length >= 1) earned.add("first_plant");
    if (plants.length >= 5) earned.add("five_plants");
    if (plants.length >= 10) earned.add("ten_plants");
    if (streak >= 7) earned.add("streak_7");
    if (streak >= 30) earned.add("streak_30");
    return earned;
  }, [profile?.achievements, plants.length, streak]);

  // ---------------------------------------------------------------------------
  // Chart data
  // ---------------------------------------------------------------------------

  // Health chart — last 7 days, seeded loosely on plant count for determinism
  const healthData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        // Use plant count as a seed offset so it's stable during a session
        const base = 70 + ((plants.length * 3 + i * 7) % 21);
        return {
          date: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          health: Math.min(100, Math.max(50, base)),
        };
      }),
    [plants.length]
  );

  // Status bar chart
  const statusData = useMemo(
    () =>
      ["healthy", "attention", "sick", "propagating"].map((status) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: plants.filter((p) => p.status === status).length,
      })),
    [plants]
  );

  // ---------------------------------------------------------------------------
  // Sign-out handler
  // ---------------------------------------------------------------------------
  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/sign-in");
  };

  // ---------------------------------------------------------------------------
  // Loading skeleton for hero
  // ---------------------------------------------------------------------------
  if (profileLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-8">
        <div className="bg-gradient-to-br from-brand-green to-teal-400 rounded-[32px] p-6 h-48 animate-pulse" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-8">
      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Hero Card                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-br from-brand-green to-teal-400 rounded-[32px] p-6 text-white relative">
        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="absolute top-5 right-5 text-xs border border-white/50 text-white rounded-[16px] px-3 py-1.5 hover:bg-white/10 transition-colors"
        >
          Sign Out
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl shrink-0 select-none">
            🌿
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xl leading-tight truncate">
              {displayName}
            </p>
            <p className="text-sm text-white/70 truncate">{email}</p>
          </div>
        </div>

        {/* Level badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-[12px] px-3 py-1 text-sm font-semibold mb-3">
          <span>⭐</span>
          <span>Level {level} Plant Parent</span>
        </div>

        {/* XP bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-white/80 mb-1">
            <span>{xp} XP</span>
            <span>{xpToNext} XP to level up</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <span className="text-base">🔥</span>
          <span>{streak} day streak</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Stats Row                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "🌿", label: "Total Plants", value: plants.length },
          { icon: "⭐", label: "Current Level", value: level },
          {
            icon: "🔥",
            label: "Best Streak",
            value: `${longestStreak}d`,
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 flex flex-col items-center gap-1"
          >
            <span className="text-2xl select-none">{icon}</span>
            <span className="text-xl font-extrabold text-brand-carbon">
              {value}
            </span>
            <span className="text-xs text-brand-carbon/50 text-center leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Achievements                                             */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h2 className="text-lg font-extrabold text-brand-carbon mb-4">
          Achievements 🏆
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = unlockedIds.has(achievement.id);
            return (
              <div
                key={achievement.id}
                className={[
                  "bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 relative",
                  !unlocked ? "opacity-40 grayscale" : "",
                ].join(" ")}
              >
                {/* XP badge for unlocked */}
                {unlocked && (
                  <span className="absolute top-3 right-3 bg-brand-green/15 text-brand-green text-xs font-bold rounded-[12px] px-2 py-0.5">
                    +{achievement.xp} XP
                  </span>
                )}

                {/* Lock overlay */}
                {!unlocked && (
                  <span className="absolute top-3 right-3 text-sm select-none">
                    🔒
                  </span>
                )}

                <div className="text-2xl mb-2 select-none">{achievement.icon}</div>
                <p className="font-bold text-sm text-brand-carbon leading-tight">
                  {achievement.title}
                </p>
                <p className="text-xs text-brand-carbon/50 mt-0.5 leading-snug">
                  {achievement.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Analytics Charts                                         */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h2 className="text-lg font-extrabold text-brand-carbon mb-4">
          Your Green Thumb Analytics 📊
        </h2>

        {/* Chart 1: Collection Health (Area) */}
        <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 mb-4">
          <h3 className="font-bold text-brand-carbon mb-4">
            Collection Health
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#6DBE76"
                fill="#6DBE76"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Plants by Status (Bar) */}
        <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5">
          <h3 className="font-bold text-brand-carbon mb-4">
            Plants by Status
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={
                      STATUS_COLORS[entry.status] ?? "#6DBE76"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 5: Settings                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h2 className="text-lg font-extrabold text-brand-carbon mb-4">
          Preferences ⚙️
        </h2>

        <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-6">
          {/* Notification style */}
          <div>
            <p className="text-sm font-semibold text-brand-carbon mb-2">
              Notification style
            </p>
            <div className="flex gap-2">
              {(["gentle", "strict"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setNotifStyle(opt)}
                  className={[
                    "flex-1 text-sm font-semibold py-2 rounded-[16px] transition-colors capitalize",
                    notifStyle === opt
                      ? "bg-brand-green text-white"
                      : "bg-brand-card text-brand-carbon/70 hover:bg-brand-card/80",
                  ].join(" ")}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Watering style */}
          <div>
            <p className="text-sm font-semibold text-brand-carbon mb-2">
              Watering style
            </p>
            <div className="flex gap-2">
              {(["top", "bottom"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setWaterStyle(opt)}
                  className={[
                    "flex-1 text-sm font-semibold py-2 rounded-[16px] transition-colors",
                    waterStyle === opt
                      ? "bg-brand-green text-white"
                      : "bg-brand-card text-brand-carbon/70 hover:bg-brand-card/80",
                  ].join(" ")}
                >
                  {opt === "top" ? "Top watering" : "Bottom watering"}
                </button>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="border-t border-brand-card pt-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-3">
              Danger Zone
            </p>
            <button
              disabled
              title="Coming soon"
              className="w-full text-sm font-semibold border border-red-300 text-red-400 rounded-[16px] py-2 opacity-50 cursor-not-allowed"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Bottom padding so content clears bottom nav */}
      <div className="h-4" />
    </div>
  );
}
