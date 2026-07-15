"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { Award, Trash2, UserCog, Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/loading";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  canPost: boolean;
  avatarUrl: string | null;
}

interface BadgeAward {
  id: string;
  text: string;
  recipientId: string;
  awardedBy: { id: string; name: string };
  recipient: { id: string; name: string };
  createdAt: string;
  revokedAt: string | null;
}

export default function MembersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { confirm } = useToast();
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [badgeTarget, setBadgeTarget] = useState<User | null>(null);
  const [badgeText, setBadgeText] = useState("");

  const isMember = session?.user?.role === "MEMBER";

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
    enabled: isMember,
  });

  const { data: badges = [] } = useQuery<BadgeAward[]>({
    queryKey: ["badges", "all"],
    queryFn: async () => {
      const res = await fetch("/api/badges");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isMember,
  });

  const togglePostMutation = useMutation({
    mutationFn: async (user: User) => {
      const res = await fetch(`/api/users/${user.id}/posting-permission`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async (user: User) => {
      const newRole = user.role === "MEMBER" ? "GUEST" : "MEMBER";
      const res = await fetch(`/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (user: User) => {
      const res = await fetch(`/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "GUEST", deletedAt: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const awardBadgeMutation = useMutation({
    mutationFn: async () => {
      if (!badgeTarget) return;
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: badgeText, recipientId: badgeTarget.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      setBadgeOpen(false);
      setBadgeText("");
      setBadgeTarget(null);
    },
  });

  const badgeCount = (userId: string) =>
    badges?.filter((b) => b.recipientId === userId && !b.revokedAt).length ?? 0;

  const userBadges = (userId: string) =>
    badges?.filter((b) => b.recipientId === userId && !b.revokedAt) ?? [];

  if (!isMember) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-foreground/60">د للآعضاء بس</p>
      </div>
    );
  }

  if (isLoading) return <Loading />;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-teal mb-6">لوحة الأعضاء</h1>

      <div className="space-y-3">
        {users?.map((user: User) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              {/* User info row */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={user.name} src={user.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="flex gap-2 mt-1 items-center">
                    <Badge variant={user.role === "MEMBER" ? "default" : "secondary"}>
                      {user.role === "MEMBER" ? "عضو" : "رائد"}
                    </Badge>
                    {user.canPost ? (
                      <Badge variant="outline" className="text-green-600">ينشر</Badge>
                    ) : (
                      <Badge variant="outline">مقفول</Badge>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Award className="w-3.5 h-3.5 text-tea-600" />
                      {badgeCount(user.id)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User badges */}
              {userBadges(user.id).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {userBadges(user.id).map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1 rounded-full bg-tea-500/10 px-2 py-0.5 text-xs text-tea-700 dark:text-tea-300 ring-1 ring-tea-500/20"
                    >
                      <Award className="w-3 h-3" />
                      {b.text}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons row */}
              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border">
                {/* Award badge — FIRST button, solid color */}
                <Button
                  size="sm"
                  onClick={() => {
                    setBadgeTarget(user);
                    setBadgeText("");
                    setBadgeOpen(true);
                  }}
                  className="gap-1 bg-tea-600 text-white hover:bg-tea-700"
                >
                  🏆 منح وسام
                </Button>

                {/* Toggle role */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleRoleMutation.mutate(user)}
                  disabled={toggleRoleMutation.isPending || user.id === session?.user?.id}
                  className="text-xs"
                >
                  <UserCog className="w-3.5 h-3.5" />
                  {user.role === "MEMBER" ? "تنزيل لرائد" : "ترقية لعضو"}
                </Button>

                {/* Toggle posting */}
                <Button
                  size="sm"
                  variant={user.canPost ? "destructive" : "outline"}
                  onClick={() => togglePostMutation.mutate(user)}
                  disabled={togglePostMutation.isPending || user.id === session?.user?.id}
                  className="text-xs"
                >
                  {user.canPost ? (
                    <><X className="w-3.5 h-3.5" /> إيقاف النشر</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> فتح النشر</>
                  )}
                </Button>

                {/* Delete */}
                {user.id !== session?.user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      if (await confirm("متأكد تمسحه؟ مش هينفع ترجعه.")) {
                        deleteUserMutation.mutate(user);
                      }
                    }}
                    disabled={deleteUserMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    مسح
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent badges */}
      {badges && badges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-teal mb-3">الأوسمة الممنوحة</h2>
          <div className="space-y-2">
            {badges.filter((b) => !b.revokedAt).slice(0, 10).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏅</span>
                  <span className="font-medium">{b.text}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {b.recipient.name} ← من {b.awardedBy.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge dialog */}
      <Dialog open={badgeOpen} onOpenChange={setBadgeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>منح وسام لـ {badgeTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="badge-text">نص الوسام</Label>
              <Input
                id="badge-text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="مثال: وسام أحسن صانع شاي"
              />
            </div>
            {awardBadgeMutation.isError && (
              <p className="text-sm text-destructive">{awardBadgeMutation.error?.message}</p>
            )}
            <Button
              onClick={() => awardBadgeMutation.mutate()}
              disabled={awardBadgeMutation.isPending || !badgeText.trim()}
              className="w-full"
            >
              {awardBadgeMutation.isPending ? "بيحفظ…" : "اتسجّل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
