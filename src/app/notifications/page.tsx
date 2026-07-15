"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/loading";
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

const NOTIFICATION_ICONS: Record<string, string> = {
  NEW_POST: "✍️",
  NEW_COMMENT: "💬",
  REPLY_TO_COMMENT: "💬",
  REACTION: "👍",
  EVENT_INVITE: "📅",
  NEW_EVENT: "📅",
  NEW_BADGE: "🏅",
  NEW_ANNOUNCEMENT: "📢",
  NEW_BILL: "💰",
  NEW_DECISION: "🗳️",
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", "all"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (status === "loading") {
    return <Loading />;
  }

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleClick = (n: Notification) => {
    if (!n.read) {
      markReadMutation.mutate(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-teal">الإشعارات</h1>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="w-4 h-4 ml-1" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {isLoading ? (
        <Loading />
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState icon="🔔" title="مفيش إشعارات" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              role={n.link ? "button" : undefined}
              tabIndex={n.link ? 0 : undefined}
              onClick={() => handleClick(n)}
              onKeyDown={(e) => {
                if (n.link && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleClick(n);
                }
              }}
              className={cn(
                "rounded-xl border border-border bg-card p-4 shadow-sm transition-colors",
                !n.read && "bg-teal/5 border-teal/20 font-medium",
                n.read && "text-muted-foreground",
                n.link && "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0" aria-hidden>
                  {NOTIFICATION_ICONS[n.type] ?? "🔔"}
                </span>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm",
                        n.read
                          ? "text-muted-foreground"
                          : "font-bold text-foreground"
                      )}
                    >
                      {n.title}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgoArabic(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {n.body}
                  </p>
                  {n.link && (
                    <span className="text-xs text-teal mt-1 inline-block">
                      عرض ←
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
