import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Plant, Quest, Room, CarePlan, CareHistoryEntry, UserProfile } from "@/types";

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefined(v)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

// --- User ---
export const getUserProfile = (uid: string) =>
  getDoc(doc(db, "users", uid));

export const setUserProfile = (uid: string, data: Partial<UserProfile>) =>
  setDoc(doc(db, "users", uid), stripUndefined(data), { merge: true });

// --- Plants ---
export const plantsRef = (uid: string) =>
  collection(db, "users", uid, "plants");

export const getPlants = (uid: string) =>
  getDocs(query(plantsRef(uid), orderBy("addedAt", "desc")));

export const getPlant = (uid: string, plantId: string) =>
  getDoc(doc(db, "users", uid, "plants", plantId));

export const setPlant = (uid: string, plantId: string, data: Partial<Plant>) =>
  setDoc(doc(db, "users", uid, "plants", plantId), stripUndefined(data), {
    merge: true,
  });

export const clearPlantRoom = (uid: string, plantId: string) =>
  updateDoc(doc(db, "users", uid, "plants", plantId), {
    roomId: deleteField(),
  });

export const deletePlant = (uid: string, plantId: string) =>
  deleteDoc(doc(db, "users", uid, "plants", plantId));

// --- Care History ---
export const historyRef = (uid: string, plantId: string) =>
  collection(db, "users", uid, "plants", plantId, "history");

export const addHistoryEntry = (
  uid: string,
  plantId: string,
  entry: Omit<CareHistoryEntry, "id">
) => setDoc(doc(historyRef(uid, plantId)), entry);

// --- Quests ---
export const questsRef = (uid: string) =>
  collection(db, "users", uid, "quests");

export const getQuests = (uid: string) =>
  getDocs(query(questsRef(uid), orderBy("dueDate", "asc")));

export const setQuest = (uid: string, questId: string, data: Partial<Quest>) =>
  setDoc(doc(db, "users", uid, "quests", questId), stripUndefined(data), {
    merge: true,
  });

// --- Rooms ---
export const roomsRef = (uid: string) =>
  collection(db, "users", uid, "rooms");

export const roomRef = (uid: string, roomId: string) =>
  doc(db, "users", uid, "rooms", roomId);

export const getRooms = (uid: string) => getDocs(roomsRef(uid));

export const getRoom = (uid: string, roomId: string) =>
  getDoc(roomRef(uid, roomId));

export const setRoom = (uid: string, roomId: string, data: Partial<Room>) =>
  setDoc(roomRef(uid, roomId), stripUndefined(data), { merge: true });

export const deleteRoom = (uid: string, roomId: string) =>
  deleteDoc(roomRef(uid, roomId));

// --- Care Plans ---
export const carePlansRef = (uid: string) =>
  collection(db, "users", uid, "carePlans");

export const setCarePlan = (
  uid: string,
  planId: string,
  data: Partial<CarePlan>
) =>
  setDoc(doc(db, "users", uid, "carePlans", planId), stripUndefined(data), {
    merge: true,
  });
