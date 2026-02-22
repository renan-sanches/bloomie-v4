export type CareType = "water" | "mist" | "fertilize" | "prune" | "rotate" | "repot" | "diagnose" | "note";

export interface Plant {
  id: string;
  userId: string;
  name: string;
  species: string;
  roomId?: string;
  healthScore: number; // 0–100
  photoUrl?: string;
  careProfile: {
    wateringFrequencyDays: number;
    sunlight: "low" | "indirect" | "bright" | "direct";
    tempMin: number;
    tempMax: number;
    humidity: "low" | "medium" | "high";
  };
  nextWaterDate: string; // ISO date string
  nextFertilizeDate?: string;
  addedAt: string;
  status: "healthy" | "attention" | "sick" | "propagating" | "archived";
  tags?: string[];
}

export interface CareHistoryEntry {
  id: string;
  plantId: string;
  type: CareType;
  timestamp: string;
  note?: string;
  photoUrl?: string;
}

export interface Quest {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  type: CareType;
  dueDate: string;
  status: "pending" | "completed" | "snoozed" | "skipped";
  xpReward: number;
  snoozedUntil?: string;
  skipReason?: string;
}

export interface Room {
  id: string;
  userId: string;
  name: string;
  windowDirection?: "north" | "south" | "east" | "west" | "none";
  brightness?: "low" | "medium" | "bright" | "direct";
  humidity?: "low" | "medium" | "high";
  tempTendency?: "cool" | "moderate" | "warm";
  draftRisk?: boolean;
  photoUrl?: string;
}

export interface CarePlan {
  id: string;
  userId: string;
  plantId: string;
  issue: string;
  steps: Array<{ day: number; action: string; materials?: string }>;
  checkpoints: Array<{ day: number; prompt: string; photoRequired: boolean }>;
  status: "active" | "improving" | "resolved" | "needs_attention";
  startedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  longestStreak: number;
  preferences: {
    wateringStyle?: "top" | "bottom";
    notificationStyle?: "gentle" | "strict";
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
  achievements: string[];
}
