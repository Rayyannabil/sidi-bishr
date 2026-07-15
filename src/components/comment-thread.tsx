"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, timeAgoArabic } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export interface CommentData {
  id: string;
  postId: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl: string | null };
  parentId: string | null;
  replies?: CommentData[];
  content: string;
  createdAt: string;
}

interface CommentThreadProps {
  postId: string;
  comments: CommentData[];
  depth?: number;
}

export function CommentThread({ postId, comments, depth = 0 }: CommentThreadProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const newCommentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, postId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setNewComment("");
    },
  });

  const topLevel = comments.filter((c) => !c.parentId);
  return (
    <div className={cn("space-y-3", depth > 0 && "ps-4 border-s border-border")}>
      {/* New comment box — only at top level */}
      {depth === 0 && session?.user && (
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="اكتب كومنت…"
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
          <Button
            size="sm"
            onClick={() => newCommentMutation.mutate()}
            disabled={!newComment.trim() || newCommentMutation.isPending}
            className="self-end"
          >
            {newCommentMutation.isPending ? "…" : "أرسل"}
          </Button>
        </div>
      )}

      {topLevel.map((comment) => (
        <CommentItem
          key={comment.id}
          postId={postId}
          comment={comment}
          allComments={comments}
          depth={depth}
        />
      ))}
    </div>
  );
}

function CommentItem({
  postId,
  comment,
  allComments,
  depth,
}: {
  postId: string;
  comment: CommentData;
  allComments: CommentData[];
  depth: number;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { confirm } = useToast();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const replies = allComments.filter((c) => c.parentId === comment.id);

  const isAuthor = session?.user?.id === comment.authorId;
  const isMember = session?.user?.role === "MEMBER";
  const canModify = isAuthor || isMember;

  const commentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, postId }),
      });
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setReplyText("");
      setShowReply(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Avatar name={comment.author.name} src={comment.author.avatarUrl} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="rounded-xl bg-muted px-3 py-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-foreground">
                {comment.author.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgoArabic(comment.createdAt)}
              </span>

              {/* Edit / Delete buttons */}
              {canModify && !editing && (
                <div className="flex items-center gap-0.5 ms-auto">
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditText(comment.content);
                        setEditing(true);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-teal hover:bg-teal/10 transition-colors"
                      title="تعديل"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (await confirm("متأكد تمسح الكومنت؟")) deleteMutation.mutate();
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="مسح"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[50px] text-sm resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => editMutation.mutate()}
                    disabled={!editText.trim() || editMutation.isPending}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <Check className="w-3 h-3" />
                    حفظ
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <X className="w-3 h-3" />
                    إلغاء
                  </Button>
                </div>
                {editMutation.isError && (
                  <p className="text-xs text-destructive">{editMutation.error?.message}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}
          </div>

          {session?.user && depth < 3 && !editing && (
            <button
              type="button"
              onClick={() => setShowReply((v) => !v)}
              className="mt-1 text-xs text-muted-foreground hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              رد
            </button>
          )}
        </div>
      </div>

      {showReply && session?.user && (
        <div className="flex gap-2 ps-10">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="اكتب رد…"
            className="min-h-[60px] text-sm"
            rows={2}
          />
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              onClick={() =>
                commentMutation.mutate({
                  content: replyText,
                  parentId: comment.id,
                })
              }
              disabled={!replyText.trim() || commentMutation.isPending}
            >
              {commentMutation.isPending ? "…" : "أرسل"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowReply(false);
                setReplyText("");
              }}
            >
              الغي
            </Button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ps-10">
          <CommentThread postId={postId} comments={replies} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}
