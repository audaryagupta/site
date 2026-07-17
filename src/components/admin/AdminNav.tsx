"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  FileSignature,
  Gamepad2,
  Gift,
  LayoutDashboard,
  LogOut,
  Mail,
  PenLine,
  Rocket,
  ScrollText,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { LogoMark } from "@/components/Logo";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/writings", label: "Writings", icon: PenLine },
  { href: "/admin/newsletters", label: "Newsletters", icon: Mail },
  { href: "/admin/subscribers", label: "Subscribers", icon: Users },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarRange },
  { href: "/admin/availability", label: "Availability", icon: CalendarClock },
  { href: "/admin/greetings", label: "Greetings", icon: Gift },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/letterhead", label: "Letterhead", icon: FileSignature },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/logs", label: "Activity log", icon: ScrollText },
  { href: "/admin/now", label: "Now page", icon: Sparkles },
  { href: "/admin/launch", label: "Launch", icon: Rocket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 flex-none flex-col border-r border-line bg-subtle/40 p-4">
      <Link href="/admin" className="mb-8 mt-2 flex items-center gap-1.5 px-2">
        <LogoMark imgClassName="h-7" />
        <span className="align-super text-[10px] uppercase tracking-widest text-muted">
          studio
        </span>
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map((l) => {
          const active = l.exact
            ? pathname === l.href
            : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-subtle hover:text-foreground"
              )}
            >
              <Icon size={16} /> {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-line pt-4">
        <p className="truncate px-3 text-xs text-muted">{email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted transition hover:bg-subtle hover:text-foreground"
        >
          <LogOut size={16} /> Sign out
        </button>
        <Link
          href="/"
          className="mt-1 block px-3 py-2 text-xs text-muted hover:text-foreground"
        >
          ← View live site
        </Link>
      </div>
    </aside>
  );
}
