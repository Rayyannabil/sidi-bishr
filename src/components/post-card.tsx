"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Pin, Trash2, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReactionBar, type ReactionData } from "@/components/reaction-bar";
import { CommentThread, type CommentData } from "@/components/comment-thread";
import { cn, timeAgoArabic } from "@/lib/utils";

export interface PostData {
  id: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl: string | null };
  content: string;
  imageUrl: string | null;
  pinned: boolean;
  createdAt: string;
  comments: CommentData[];
  reactions: ReactionData[];
}

interface PostCardProps {
  post: PostData;
}

import { useToast } from "@/components/ui/toast";

export function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { confirm } = useToast();
  const [showComments, setShowComments] = useState(false);

  const isAuthor = session?.user?.id === post.authorId;
  const isMember = session?.user?.role === "MEMBER";
  const canDelete = isAuthor || isMember;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/pin`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md animate-fade-in",
        post.pinned && "ring-2 ring-teal/20 border-teal/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={post.author.name} src={post.author.avatarUrl} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {post.author.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgoArabic(post.createdAt)}
            </span>
            {post.pinned && (
              <Badge variant="tea" className="text-[10px] gap-0.5">
                <Pin className="w-2.5 h-2.5" />
                مثبّت
              </Badge>
            )}
          </div>
        </div>
        {canDelete && (
          <div className="flex items-center gap-1">
            {isMember && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title={post.pinned ? "فك التثبيت" : "ثبّت"}
                onClick={() => pinMutation.mutate()}
                disabled={pinMutation.isPending}
              >
                <Pin
                  className={cn(
                    "w-4 h-4 transition-colors",
                    post.pinned ? "text-teal fill-teal" : "text-muted-foreground"
                  )}
                />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="امسح"
              onClick={async () => {
                if (await confirm("متأكد تمسحه؟ مش هينفع ترجعه.")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-3 whitespace-pre-wrap break-words text-foreground text-[15px] leading-relaxed">
        {post.content}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <img
            src={post.imageUrl}
            alt=""
            className="w-full max-h-[400px] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Reactions */}
      <div className="mt-3">
        <ReactionBar
          postId={post.id}
          reactions={post.reactions}
          currentUserId={session?.user?.id}
        />
      </div>

      {/* Comments toggle */}
      <div className="mt-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {(post.comments?.length ?? 0) > 0
            ? `${post.comments?.length ?? 0} كومنت — ${showComments ? "إخفي" : "اعرض"}`
            : "اكتب كومنت"}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3">
          <CommentThread postId={post.id} comments={post.comments ?? []} />
        </div>
      )}
    </div>
  );
}
