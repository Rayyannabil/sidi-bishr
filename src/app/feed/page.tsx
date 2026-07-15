"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/loading";
import { PostCard, type PostData } from "@/components/post-card";

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const { data: posts, isLoading, error } = useQuery<PostData[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = "";
      if (file) {
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
          throw new Error(err.error || "رفع الصورة فشل");
        }
        const data = await uploadRes.json();
        imageUrl = data.url;
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      setFile(null);
      setFocused(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  if (status === "loading" || status === "unauthenticated") {
    return <Loading />;
  }

  const canPost = session?.user?.role === "MEMBER" || session?.user?.canPost;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-teal mb-6">آخر أخبار الشقة</h1>

      {/* Post box — modern */}
      {canPost ? (
        <div
          className={cn(
            "mb-6 rounded-2xl border bg-card p-4 transition-all duration-200",
            focused
              ? "border-teal/40 shadow-md ring-1 ring-teal/10"
              : "border-border shadow-sm"
          )}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="إيه اللي بيحصل؟"
            className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-[15px]"
            rows={3}
          />

          {/* File preview */}
          {file && (
            <div className="mt-3 relative inline-block">
              {file.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="max-h-40 rounded-xl border border-border object-cover"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="max-h-40 rounded-xl border border-border"
                  controls
                />
              )}
              <button
                type="button"
                onClick={() => setFile(null)}
                className="absolute top-1 left-1 rounded-full bg-black/60 p-1 text-white hover:bg-destructive transition-colors"
                aria-label="شيل الملف"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            {createPostMutation.isError && (
              <span className="text-sm text-destructive">
                {createPostMutation.error?.message}
              </span>
            )}
            <div className="flex items-center gap-2 ms-auto">
              {/* Attach button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
                className="hidden"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || createPostMutation.isPending}
                title="إرفق صورة أو فيديو"
                className="h-9 w-9"
              >
                <ImagePlus className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => createPostMutation.mutate()}
                disabled={(!content.trim() && !file) || createPostMutation.isPending}
                className="gap-1.5"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {createPostMutation.isPending ? "بنشر…" : "انشر"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          لسه ماتقدرش تنشر هنا — اطلب من أحد الأعضاء يفتحلك النشر.
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <Loading />
      ) : error ? (
        <EmptyState title="حصل خطأ، حاول تاني." />
      ) : !posts || posts.length === 0 ? (
        <EmptyState
          icon="☕"
          title="مفيش بوستات لسه… كن أول واحد يبدأ الونس!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
