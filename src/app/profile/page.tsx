"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { Award, Check, X, Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/loading";
import { timeAgoArabic } from "@/lib/utils";

interface BadgeAward {
  id: string;
  text: string;
  awardedBy: { id: string; name: string };
  createdAt: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  canPost: boolean;
  avatarUrl: string | null;
  createdAt: string;
  badgesReceived: BadgeAward[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("حصل خطأ");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  const updateNameMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      setEditing(false);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  if (status === "loading" || isLoading) return <Loading />;

  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <EmptyState title="سجّل دخول الأول" />
      </div>
    );
  }

  const isMember = session.user.role === "MEMBER";
  const avatarUrl = profile?.avatarUrl || undefined;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarMutation.mutate(file);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative shrink-0">
              <Avatar
                name={session.user.name}
                src={avatarUrl}
                size="lg"
                className="bg-teal/10 text-teal"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                className="absolute -bottom-1 -left-1 flex items-center justify-center w-7 h-7 rounded-full bg-teal text-white shadow-md hover:bg-teal/90 transition-colors disabled:opacity-50"
                title="تغيير الصورة"
              >
                {uploadAvatarMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">الاسم</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateNameMutation.mutate()}
                      disabled={updateNameMutation.isPending}
                    >
                      <Check className="w-4 h-4 ml-1" />
                      {updateNameMutation.isPending ? "بيحفظ…" : "اتسجّل"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(false)}
                    >
                      <X className="w-4 h-4 ml-1" />
                      إلغاء
                    </Button>
                  </div>
                  {updateNameMutation.isError && (
                    <p className="text-sm text-destructive">
                      {updateNameMutation.error?.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">
                    {session.user.name}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setName(session.user.name);
                      setEditing(true);
                    }}
                    aria-label="تعديل الاسم"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              {!editing && (
                <Badge
                  variant={isMember ? "tea" : "secondary"}
                  className="mt-1"
                >
                  {isMember ? "عضو" : "رائد"}
                </Badge>
              )}
              {uploadAvatarMutation.isError && (
                <p className="text-sm text-destructive mt-1">
                  {uploadAvatarMutation.error?.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-teal mb-3 flex items-center gap-2">
          <Award className="w-5 h-5" />
          الأوسمة
        </h2>
        {!profile?.badgesReceived || profile.badgesReceived.length === 0 ? (
          <EmptyState icon="🏅" title="لسة مفيش أوسمة — اشتغل ع نفسك!" />
        ) : (
          <div className="space-y-2">
            {profile.badgesReceived.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏅</span>
                  <span className="text-sm font-medium">{b.text}</span>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  <p>من: {b.awardedBy.name}</p>
                  <p>{timeAgoArabic(b.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        تسجيل الخروج
      </Button>
    </div>
  );
}
