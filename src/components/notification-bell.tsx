"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn, timeAgoArabic } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadCount } = useQuery<number>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count ?? 0;
    },
    refetchInterval: 30_000,
  });

  const { data: recent } = useQuery<Notification[]>({
    queryKey: ["notifications", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = unreadCount ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        className="relative rounded-lg p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-lg z-50 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-medium">الإشعارات</span>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs text-teal hover:underline"
              >
                علّم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recent && recent.length > 0 ? (
              recent.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/notifications"}
                  onClick={() => {
                    if (!n.read) markReadMutation.mutate(n.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block border-b border-border px-4 py-3 hover:bg-muted transition-colors",
                    !n.read && "bg-teal/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {timeAgoArabic(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                مفيش إشعارات جديدة
              </div>
            )}
          </div>
          <div className="border-t border-border px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-teal hover:underline"
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
