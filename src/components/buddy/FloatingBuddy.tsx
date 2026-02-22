"use client";

import { usePathname, useRouter } from "next/navigation";
import { Leaf } from "lucide-react";

export function FloatingBuddy() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on the buddy page itself
  if (pathname === "/buddy") return null;

  return (
    <button
      onClick={() => router.push("/buddy")}
      aria-label="Open Bloomie Buddy"
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full bg-brand-green shadow-[0px_4px_24px_rgba(0,0,0,0.2)] flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95"
    >
      <Leaf size={26} className="text-white" />
    </button>
  );
}
