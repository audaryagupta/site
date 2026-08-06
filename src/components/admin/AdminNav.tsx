"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  FileSignature,
  Gamepad2,
  Gift,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  PenLine,
  Rocket,
  ScrollText,
  Settings,
  Sparkles,
  Target,
  Type,
  UserCog,
  Users,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { LogoMark } from "@/components/Logo";

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  ownerOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: typeof LayoutDashboard;
  links: NavLink[];
}

// Grouped so the sidebar stays tidy — each category collapses, and only the
// one containing the current page is open by default.
const groups: NavGroup[] = [
  {
    label: "Content",
    icon: PenLine,
    links: [
      { href: "/admin/writings", label: "Writings", icon: PenLine },
      { href: "/admin/newsletters", label: "Newsletters", icon: Mail },
      { href: "/admin/now", label: "Now page", icon: Sparkles },
      { href: "/admin/site-text", label: "Site text", icon: Type, ownerOnly: true },
      { href: "/admin/games", label: "Games", icon: Gamepad2 },
      { href: "/admin/links", label: "Link hub", icon: Link2 },
    ],
  },
  {
    label: "Audience",
    icon: Users,
    links: [
      { href: "/admin/subscribers", label: "Subscribers", icon: Users },
      { href: "/admin/contacts", label: "Contacts", icon: Users },
      { href: "/admin/greetings", label: "Greetings", icon: Gift },
    ],
  },
  {
    label: "Scheduling",
    icon: CalendarDays,
    links: [
      { href: "/admin/scheduling", label: "Appointments & calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Insights",
    icon: BarChart3,
    links: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/logs", label: "Activity log", icon: ScrollText },
    ],
  },
  {
    label: "Personal",
    icon: Target,
    links: [
      { href: "/admin/goals", label: "Goals", icon: Target, ownerOnly: true },
      { href: "/admin/bookshelf", label: "My Bookshelf", icon: BookOpen, ownerOnly: true },
    ],
  },
  {
    label: "Tools",
    icon: FileSignature,
    links: [{ href: "/admin/letterhead", label: "Letterhead", icon: FileSignature }],
  },
  {
    label: "Admin",
    icon: Settings,
    links: [
      { href: "/admin/access", label: "Access", icon: UserCog, ownerOnly: true },
      { href: "/admin/launch", label: "Launch", icon: Rocket, ownerOnly: true },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminNav({
  email,
  role,
}: {
  email?: string | null;
  role?: string;
}) {
  const pathname = usePathname();

  const isOwner = role === "owner";
  const visibleGroups = groups
    .map((g) => ({
      ...g,
      links: g.links.filter((l) => !l.ownerOnly || isOwner),
    }))
    .filter((g) => g.links.length > 0);

  // Open the group that owns the current route by default.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const g of visibleGroups) {
      state[g.label] = g.links.some((l) => pathname.startsWith(l.href));
    }
    return state;
  });

  const overviewActive = pathname === "/admin";

  return (
    <aside className="flex w-60 flex-none flex-col border-r border-line bg-subtle/40 p-4">
      <Link href="/admin" className="mb-6 mt-2 flex items-center gap-1.5 px-2">
        <LogoMark imgClassName="h-7" />
        <span className="align-super text-[10px] uppercase tracking-widest text-muted">
          studio
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <Link
          href="/admin"
          className={cx(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
            overviewActive
              ? "bg-foreground text-background"
              : "text-muted hover:bg-subtle hover:text-foreground"
          )}
        >
          <LayoutDashboard size={16} /> Overview
        </Link>

        {visibleGroups.map((g) => {
          const GroupIcon = g.icon;
          const isOpen = open[g.label];
          const hasActive = g.links.some((l) => pathname.startsWith(l.href));
          return (
            <div key={g.label} className="pt-1">
              <button
                onClick={() => setOpen((s) => ({ ...s, [g.label]: !s[g.label] }))}
                className={cx(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider transition",
                  hasActive ? "text-foreground" : "text-muted hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <GroupIcon size={14} /> {g.label}
                </span>
                <ChevronDown
                  size={14}
                  className={cx("transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-2">
                  {g.links.map((l) => {
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
                </div>
              )}
            </div>
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
