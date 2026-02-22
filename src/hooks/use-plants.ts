"use client";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Plant } from "@/types";

export function usePlants(uid: string | undefined) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", uid, "plants"),
      orderBy("addedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPlants(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plant)));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { plants, loading };
}
