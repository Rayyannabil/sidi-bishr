"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Calendar, MapPin, Plus, Trash2, Camera, X } from "lucide-react";
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
import { formatArabicDate } from "@/lib/utils";

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  coverImage: string | null;
  type: string;
  createdBy: { id: string; name: string };
  _count?: { memories: number };
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { confirm } = useToast();
  const [open, setOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    coverImage: "",
    type: "HANGOUT",
  });

  const { data: events, isLoading } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let coverImage = form.coverImage;
      if (coverFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", coverFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        setUploading(false);
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "رفع الصورة فشل");
        }
        const data = await uploadRes.json();
        coverImage = data.url;
      }
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, coverImage }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setCoverFile(null);
      setForm({
        title: "",
        description: "",
        date: "",
        location: "",
        coverImage: "",
        type: "HANGOUT",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (status === "loading") {
    return <Loading />;
  }

  const isMember = session?.user?.role === "MEMBER";
  const now = new Date();
  const upcoming = events?.filter((e) => new Date(e.date) >= now) ?? [];
  const hasIftar = upcoming.some((e) => e.type === "IFTAR");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-teal">مناسبات الشقة</h1>
        {isMember && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-1" />
                مناسبة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>أضف مناسبة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-title">العنوان</Label>
                  <Input
                    id="ev-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-desc">الوصف</Label>
                  <Textarea
                    id="ev-desc"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-date">التاريخ</Label>
                  <Input
                    id="ev-date"
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-loc">المكان</Label>
                  <Input
                    id="ev-loc"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-cover">صورة الغلاف</Label>
                  <input
                    ref={coverInputRef}
                    id="ev-cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setCoverFile(f);
                    }}
                    className="block w-full text-sm text-muted-foreground file:ml-3 file:rounded-lg file:border-0 file:bg-teal file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90 cursor-pointer"
                  />
                  {coverFile && (
                    <div className="mt-2 relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(coverFile)}
                        alt="preview"
                        className="max-h-32 rounded-xl border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCoverFile(null)}
                        className="absolute top-1 left-1 rounded-full bg-black/60 p-1 text-white hover:bg-destructive transition-colors"
                        aria-label="شيل الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-type">النوع</Label>
                  <select
                    id="ev-type"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="HANGOUT">لمة</option>
                    <option value="IFTAR">إفطار</option>
                  </select>
                </div>
                {createMutation.isError && (
                  <p className="text-sm text-destructive">
                    {createMutation.error?.message}
                  </p>
                )}
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || uploading}
                  className="w-full"
                >
                  {uploading ? "برفع الصورة…" : createMutation.isPending ? "بيحفظ…" : "اتسجّل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Annual Iftar banner — shown when there IS an upcoming iftar */}
      {hasIftar && (
        <div className="mb-6 rounded-2xl bg-gradient-to-l from-teal to-teal-light text-white p-6 shadow-md">
          <h2 className="text-xl font-bold mb-1">
            إفطار شقة سيدي بشر — أكبر لمّة في السنة
          </h2>
          <p className="text-white/80 text-sm">
            كل سنة بنتجمع على فطار جماعي… ماتفوّتش!
          </p>
        </div>
      )}

      {isLoading ? (
        <Loading />
      ) : !upcoming || upcoming.length === 0 ? (
        <EmptyState icon="📅" title="مفيش مناسبات قادمة دلوقتي." />
      ) : (
        <div className="space-y-4">
          {upcoming.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.coverImage && (
                <div className="w-full h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{event.title}</CardTitle>
                  <Badge
                    variant={event.type === "IFTAR" ? "teal" : "secondary"}
                    className="shrink-0"
                  >
                    {event.type === "IFTAR" ? "إفطار" : "لمة"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatArabicDate(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/memories?event=${event.id}`}
                    className="inline-flex items-center gap-1 text-sm text-teal hover:underline"
                  >
                    <Camera className="w-4 h-4" />
                    ألبوم الذكريات
                    {event._count?.memories ? ` (${event._count.memories})` : ""}
                  </Link>
                  {isMember && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        if (await confirm("متأكد تمسحه؟ مش هينفع ترجعه.")) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      aria-label="حذف المناسبة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
