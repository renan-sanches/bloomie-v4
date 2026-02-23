"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/nav/Sidebar";
import { BottomNav } from "@/components/nav/BottomNav";
import { FloatingBuddy } from "@/components/buddy/FloatingBuddy";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-brand-carbon/60">
          <span className="w-6 h-6 rounded-full border-2 border-brand-green/30 border-t-brand-green animate-spin" />
          <span className="text-sm font-medium">Loading Bloomie…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto min-h-screen">
        {children}
      </main>
      <BottomNav />
      <FloatingBuddy />
    </div>
  );
}
