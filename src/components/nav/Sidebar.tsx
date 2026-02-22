"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Leaf, ScanLine, CheckSquare, User,
  Map, BookOpen, Calendar, MessageCircle,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/jungle", label: "My Jungle", icon: Leaf },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/quests", label: "Quests", icon: CheckSquare },
  { href: "/rooms", label: "Room Map", icon: Map },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/buddy", label: "Bloomie Buddy", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-brand-card p-6 gap-1 shrink-0">
      <div className="mb-8">
        <span className="text-2xl font-extrabold text-brand-carbon">🌿 Bloomie</span>
      </div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-semibold transition-colors ${
              active
                ? "bg-brand-green/10 text-brand-green"
                : "text-brand-carbon/60 hover:bg-brand-card"
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
