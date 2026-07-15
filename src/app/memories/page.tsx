"use client";

import { useState, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loading } from "@/components/loading";

interface MemoryItem {
  id: string;
  url: string;
  caption: string | null;
  type: string;
  createdAt: string;
  event: { id: string; title: string; date: string };
  uploadedBy: { id: string; name: string };
}

interface EventItem {
  id: string;
  title: string;
  date: string;
}

export default function MemoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">بنحضّر الشاي…</p></div>}>
      <MemoriesContent />
    </Suspense>
  );
}

function MemoriesContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const filterEventId = searchParams?.get("event");
  const queryClient = useQueryClient();
  const { confirm } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    eventId: "",
    caption: "",
    type: "image",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: memories, isLoading } = useQuery<MemoryItem[]>({
    queryKey: ["memories"],
    queryFn: async () => {
      const res = await fetch("/api/memories");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
  });

  const { data: events } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("اختر ملف الأول");
      // Step 1: upload file
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      setUploading(false);
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "الرفع فشل");
      }
      const { url } = await uploadRes.json();
      // Step 2: create memory record
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setOpen(false);
      setForm({ eventId: "", caption: "", type: "image" });
      setFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });

  const isMember = session?.user?.role === "MEMBER";

  // Filter by event if URL param present
  const filtered = useMemo(() => {
    if (!memories) return [];
    if (filterEventId) {
      return memories.filter((m) => m.event?.id === filterEventId);
    }
    return memories;
  }, [memories, filterEventId]);

  // Group by event
  const grouped = useMemo(() => {
    const groups: Record<string, { eventTitle: string; items: MemoryItem[] }> =
      {};
    filtered.forEach((m) => {
      const key = m.event?.id ?? "unknown";
      if (!groups[key]) {
        groups[key] = { eventTitle: m.event?.title ?? "ذكريات", items: [] };
      }
      groups[key].items.push(m);
    });
    return groups;
  }, [filtered]);

  if (status === "loading") {
    return <Loading />;
  }

  const filterEventTitle = filterEventId
    ? events?.find((e) => e.id === filterEventId)?.title
    : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-teal">ذكرياتنا</h1>
          {filterEventTitle && (
            <p className="text-sm text-muted-foreground mt-1">
              ذكريات: {filterEventTitle}
            </p>
          )}
        </div>
        {isMember && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 ml-1" />
                ارفع ذكرى
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ارفع ذكرى جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mem-event">المناسبة</Label>
                  <select
                    id="mem-event"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.eventId}
                    onChange={(e) =>
                      setForm({ ...form, eventId: e.target.value })
                    }
                  >
                    <option value="">اختر مناسبة</option>
                    {events?.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mem-file">الصورة/الفيديو</Label>
                  <input
                    ref={fileInputRef}
                    id="mem-file"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        setForm({ ...form, type: f.type.startsWith("video/") ? "video" : "image" });
                      }
                    }}
                    className="block w-full text-sm text-muted-foreground file:ml-3 file:rounded-lg file:border-0 file:bg-teal file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90 cursor-pointer"
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mem-caption">تعليق</Label>
                  <Textarea
                    id="mem-caption"
                    value={form.caption}
                    onChange={(e) =>
                      setForm({ ...form, caption: e.target.value })
                    }
                  />
                </div>
                {uploadMutation.isError && (
                  <p className="text-sm text-destructive">
                    {uploadMutation.error?.message}
                  </p>
                )}
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={uploadMutation.isPending || uploading || !form.eventId || !file}
                  className="w-full"
                >
                  {uploadMutation.isPending ? "بيحفظ…" : "اتسجّل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isMember && (
        <div className="mb-6 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          رفع الذكريات للأعضاء بس.
        </div>
      )}

      {isLoading ? (
        <Loading />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon="📸" title="ابدأ ارفع أول ذكرى" />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([eventKey, group]) => (
            <div key={eventKey}>
              <h2 className="text-lg font-semibold text-teal mb-3 pb-2 border-b border-border">
                {group.eventTitle}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {group.items.map((m) => (
                  <div
                    key={m.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    {m.type === "video" ? (
                      <video
                        src={m.url}
                        className="aspect-square w-full object-cover"
                        controls
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt={m.caption || ""}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    {m.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white truncate">
                          {m.caption}
                        </p>
                      </div>
                    )}
                    {isMember && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (await confirm("متأكد تمسحه؟ مش هينفع ترجعه.")) {
                            deleteMutation.mutate(m.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="absolute top-1 left-1 rounded-lg bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="حذف الذكرى"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
