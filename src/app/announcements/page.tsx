"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Megaphone, Pin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loading } from "@/components/loading";
import { timeAgoArabic } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string };
}

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { confirm } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", pinned: false });

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await fetch("/api/announcements");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setOpen(false);
      setForm({ title: "", content: "", pinned: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  if (status === "loading") {
    return <Loading />;
  }

  const isMember = session?.user?.role === "MEMBER";

  // Sort: pinned first
  const sorted = [...(announcements ?? [])].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned)
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-teal">إعلانات مهمة</h1>
        {isMember && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-1" />
                إعلان جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>أضف إعلان</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="an-title">العنوان</Label>
                  <Input
                    id="an-title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="an-content">المحتوى</Label>
                  <Textarea
                    id="an-content"
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) =>
                      setForm({ ...form, pinned: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-input"
                  />
                  <Pin className="w-4 h-4 text-teal" />
                  تثبيت في الأعلى
                </label>
                {createMutation.isError && (
                  <p className="text-sm text-destructive">
                    {createMutation.error?.message}
                  </p>
                )}
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "بيحفظ…" : "اتسجّل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <Loading />
      ) : !sorted || sorted.length === 0 ? (
        <EmptyState icon="📢" title="لا توجد إعلانات حالياً." />
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => (
            <Card
              key={a.id}
              className={a.pinned ? "ring-2 ring-teal/20" : undefined}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    {a.pinned && <Pin className="w-4 h-4 text-teal" />}
                    {a.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.pinned && <Badge variant="tea">مثبّت</Badge>}
                    {isMember && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (await confirm("متأكد تمسحه؟ مش هينفع ترجعه.")) {
                            deleteMutation.mutate(a.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        aria-label="حذف الإعلان"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {a.content}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.author.name} — {timeAgoArabic(a.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
