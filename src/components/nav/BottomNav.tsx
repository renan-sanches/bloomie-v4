"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Leaf, ScanLine, CheckSquare, User } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/jungle", label: "Jungle", icon: Leaf },
  { href: "/scanner", label: "Scan", icon: ScanLine },
  { href: "/quests", label: "Quests", icon: CheckSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-card flex md:hidden z-50">
      {links.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
              active ? "text-brand-green" : "text-brand-carbon/40"
            }`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
