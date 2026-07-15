"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Gavel, Plus, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loading } from "@/components/loading";
import { timeAgoArabic, cn } from "@/lib/utils";

interface Decision {
  id: string;
  title: string;
  description: string;
  threshold: string;
  status: string;
  createdBy: { id: string; name: string };
  votes: {
    id: string;
    userId: string;
    choice: string;
    user: { id: string; name: string };
  }[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: "مقترح",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
  IMPLEMENTED: "منفّذ",
};

const STATUS_VARIANTS: Record<
  string,
  "secondary" | "teal" | "destructive" | "tea"
> = {
  PROPOSED: "secondary",
  APPROVED: "teal",
  REJECTED: "destructive",
  IMPLEMENTED: "tea",
};

const VOTE_LABELS: Record<string, string> = {
  YES: "موافق",
  NO: "رافض",
  ABSTAIN: "امتناع",
};

const VOTE_ICONS: Record<string, React.ReactNode> = {
  YES: <ThumbsUp className="w-4 h-4" />,
  NO: <ThumbsDown className="w-4 h-4" />,
  ABSTAIN: <Minus className="w-4 h-4" />,
};

const THRESHOLD_LABELS: Record<string, string> = {
  MAJORITY: "أغلبية بسيطة",
  TWO_THIRDS: "ثلثين",
  UNANIMOUS: "إجماع",
};

export default function DecisionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    threshold: "MAJORITY",
  });

  // Guard: redirect guests to feed
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
    if (
      status === "authenticated" &&
      session?.user?.role !== "MEMBER"
    ) {
      router.replace("/");
    }
  }, [status, session, router]);

  const { data: decisions, isLoading } = useQuery<Decision[]>({
    queryKey: ["decisions"],
    queryFn: async () => {
      const res = await fetch("/api/decisions");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    enabled: status === "authenticated" && session?.user?.role === "MEMBER",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/decisions", {
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
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      setOpen(false);
      setForm({ title: "", description: "", threshold: "MAJORITY" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({
      decisionId,
      choice,
    }: {
      decisionId: string;
      choice: string;
    }) => {
      const res = await fetch(`/api/decisions/${decisionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });

  if (status === "loading" || status === "unauthenticated") {
    return <Loading />;
  }

  if (session?.user?.role !== "MEMBER") {
    return <Loading />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-teal">قرارات الأعضاء</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1" />
              قرار جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>أضف قرار</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dec-title">العنوان</Label>
                <Input
                  id="dec-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dec-desc">الوصف</Label>
                <Textarea
                  id="dec-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dec-thr">الأغلبية المطلوبة</Label>
                <select
                  id="dec-thr"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.threshold}
                  onChange={(e) =>
                    setForm({ ...form, threshold: e.target.value })
                  }
                >
                  <option value="MAJORITY">أغلبية بسيطة</option>
                  <option value="TWO_THIRDS">ثلثين</option>
                  <option value="UNANIMOUS">إجماع</option>
                </select>
              </div>
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
      </div>

      {isLoading ? (
        <Loading />
      ) : !decisions || decisions.length === 0 ? (
        <EmptyState icon="🗳️" title="مفيش قرارات لسه" />
      ) : (
        <div className="space-y-4">
          {decisions.map((d) => {
            const myVote = d.votes.find((v) => v.userId === session?.user?.id);
            const yesCount = d.votes.filter((v) => v.choice === "YES").length;
            const noCount = d.votes.filter((v) => v.choice === "NO").length;
            const abstainCount = d.votes.filter(
              (v) => v.choice === "ABSTAIN"
            ).length;

            return (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-teal" />
                      {d.title}
                    </CardTitle>
                    <Badge
                      variant={STATUS_VARIANTS[d.status] ?? "secondary"}
                      className="shrink-0"
                    >
                      {STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {d.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{d.createdBy.name}</span>
                    <span>—</span>
                    <span>{timeAgoArabic(d.createdAt)}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="outline">
                      {THRESHOLD_LABELS[d.threshold] ?? d.threshold}
                    </Badge>
                  </div>

                  {/* Vote counts */}
                  <div className="flex gap-4 mb-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-4 h-4 text-teal" />
                      {yesCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsDown className="w-4 h-4 text-destructive" />
                      {noCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Minus className="w-4 h-4 text-muted-foreground" />
                      {abstainCount}
                    </span>
                  </div>

                  {/* Vote buttons */}
                  {d.status === "PROPOSED" && (
                    <div className="flex gap-2 mb-3">
                      {(["YES", "NO", "ABSTAIN"] as const).map((choice) => (
                        <Button
                          key={choice}
                          size="sm"
                          variant={
                            myVote?.choice === choice ? "default" : "outline"
                          }
                          onClick={() =>
                            voteMutation.mutate({
                              decisionId: d.id,
                              choice,
                            })
                          }
                          disabled={voteMutation.isPending}
                          className={cn(
                            myVote?.choice === choice &&
                              choice === "YES" &&
                              "bg-teal",
                            myVote?.choice === choice &&
                              choice === "NO" &&
                              "bg-destructive",
                            myVote?.choice === choice &&
                              choice === "ABSTAIN" &&
                              "bg-muted text-foreground"
                          )}
                        >
                          {VOTE_ICONS[choice]}
                          <span className="mr-1">{VOTE_LABELS[choice]}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Who voted what */}
                  {d.votes.length > 0 && (
                    <div className="mt-2">
                      <Separator className="mb-2" />
                      <div className="flex flex-wrap gap-2">
                        {d.votes.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          >
                            {v.user.name}:
                            <Badge
                              variant={
                                v.choice === "YES"
                                  ? "teal"
                                  : v.choice === "NO"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {VOTE_LABELS[v.choice]}
                            </Badge>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {myVote && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      صوتك: {VOTE_LABELS[myVote.choice]}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
