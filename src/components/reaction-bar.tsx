"use client";

import type { ComponentType } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ThumbsUp, Heart, Laugh, Frown, Angry,
} from "lucide-react";
import { MiddleFinger } from "@/components/icons/middle-finger";
import { WowFace } from "@/components/icons/wow-face";
import { cn } from "@/lib/utils";

export type ReactionType =
  | "LIKE"
  | "LOVE"
  | "HAHA"
  | "WOW"
  | "SAD"
  | "ANGRY"
  | "FLIP";

export const REACTIONS: { type: ReactionType; icon: ComponentType<{ className?: string }>; label: string; color: string }[] = [
  { type: "LIKE",  icon: ThumbsUp, label: "أعجبني", color: "text-blue-500" },
  { type: "LOVE",  icon: Heart,    label: "أحببته", color: "text-red-500" },
  { type: "HAHA",  icon: Laugh,    label: "هاها",   color: "text-amber-500" },
  { type: "WOW",   icon: WowFace,   label: "واو",    color: "text-yellow-500" },
  { type: "SAD",   icon: Frown,    label: "حزين",   color: "text-gray-500" },
  { type: "ANGRY", icon: Angry,    label: "غاضب",   color: "text-orange-600" },
  { type: "FLIP",  icon: MiddleFinger, label: "تصبيع", color: "text-pink-500" },
];

export interface ReactionData {
  id: string;
  userId: string;
  user: { id: string; name: string };
  type: ReactionType;
}

interface ReactionBarProps {
  postId: string;
  reactions: ReactionData[];
  currentUserId?: string;
}

export function ReactionBar({ postId, reactions, currentUserId }: ReactionBarProps) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async (type: ReactionType) => {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const myReaction = reactions.find((r) => r.userId === currentUserId);

  const reactionCounts = REACTIONS.map((r) => ({
    ...r,
    count: reactions.filter((re) => re.type === r.type).length,
  })).filter((r) => r.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactionCounts.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {reactionCounts.map((r) => {
            const Icon = r.icon;
            return (
              <span
                key={r.type}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
                  myReaction?.type === r.type
                    ? "bg-teal/10 ring-1 ring-teal/30"
                    : "bg-muted"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", r.color)} />
                <span className="text-muted-foreground">{r.count}</span>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-0.5 flex-wrap">
        {REACTIONS.map((r) => {
          const Icon = r.icon;
          const active = myReaction?.type === r.type;
          return (
            <button
              key={r.type}
              type="button"
              title={r.label}
              aria-label={r.label}
              aria-pressed={active}
              onClick={() => toggleMutation.mutate(r.type)}
              disabled={toggleMutation.isPending}
              className={cn(
                "rounded-full p-1.5 transition-all hover:scale-125 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50",
                active && "scale-110 bg-teal/10 ring-1 ring-teal/30"
              )}
            >
              <Icon className={cn("w-5 h-5", active ? r.color : "text-muted-foreground")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
