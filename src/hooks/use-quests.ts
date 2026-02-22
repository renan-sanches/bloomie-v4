"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Quest } from "@/types";

export function useQuests(uid: string | undefined) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", uid, "quests"),
      where("status", "==", "pending"),
      orderBy("dueDate", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setQuests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quest)));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const today = new Date().toISOString().split("T")[0];

  const overdue = useMemo(
    () => quests.filter((q) => q.dueDate < today),
    [quests, today]
  );
  const todayQuests = useMemo(
    () => quests.filter((q) => q.dueDate === today),
    [quests, today]
  );
  const upcoming = useMemo(
    () => quests.filter((q) => q.dueDate > today),
    [quests, today]
  );

  return { quests, overdue, todayQuests, upcoming, loading };
}
