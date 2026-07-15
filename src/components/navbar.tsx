"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const memberNav = [
  { href: "/", label: "الرئيسية" },
  { href: "/events", label: "المناسبات" },
  { href: "/memories", label: "الذكريات" },
  { href: "/announcements", label: "الإعلانات" },
  { href: "/bills", label: "الحسابات" },
  { href: "/decisions", label: "القرارات" },
  { href: "/members", label: "لوحة الأعضاء" },
  { href: "/profile", label: "بروفايلي" },
];

const guestNav = [
  { href: "/", label: "الرئيسية" },
  { href: "/events", label: "المناسبات" },
  { href: "/memories", label: "الذكريات" },
  { href: "/announcements", label: "الإعلانات" },
  { href: "/profile", label: "بروفايلي" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return <div className="h-24 border-b bg-card" />;
  }

  if (!session) {
    return (
      <nav className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-40">
        <div className="container mx-auto flex h-24 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={96} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-teal hover:underline"
            >
              ادخل
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              انضم كـرائد
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const isMember = session.user.role === "MEMBER";
  const navItems = isMember ? memberNav : guestNav;

  return (
    <nav className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-40">
      <div className="container mx-auto flex h-24 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo size={96} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-teal text-white"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          {/* Mobile menu button */}
          <details className="md:hidden relative">
            <summary className="list-none cursor-pointer p-2 rounded-md hover:bg-muted">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute left-0 mt-2 w-48 rounded-lg border bg-card shadow-lg py-1 z-50">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-4 py-2 text-sm",
                    pathname === item.href ? "bg-muted font-medium text-teal" : "hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </nav>
  );
}
