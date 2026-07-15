"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatEGP, formatArabicDate } from "@/lib/utils";

interface Bill {
  id: string;
  category: string;
  title: string;
  amount: number;
  billDate: string;
  paidBy: { id: string; name: string };
  settlements: {
    id: string;
    amount: number;
    fromUser: { id: string; name: string };
    toUser: { id: string; name: string };
    createdAt: string;
  }[];
}

interface BalanceItem {
  userId: string;
  name: string;
  owed: number;
  paid: number;
  balance: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  canPost: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  GAS: "الغاز",
  ELECTRICITY: "الكهرباء",
  WATER: "المياه",
  INTERNET: "الإنترنت",
  OTHER: "أخرى",
};

const CATEGORY_ICONS: Record<string, string> = {
  GAS: "🔥",
  ELECTRICITY: "⚡",
  WATER: "💧",
  INTERNET: "🌐",
  OTHER: "📋",
};

export default function BillsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [billOpen, setBillOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [billForm, setBillForm] = useState({
    category: "GAS",
    title: "",
    amount: "",
    billDate: "",
  });
  const [settleForm, setSettleForm] = useState({ toUserId: "", amount: "" });

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

  const { data: bills, isLoading: billsLoading } = useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      const res = await fetch("/api/bills");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    enabled: status === "authenticated" && session?.user?.role === "MEMBER",
  });

  const { data: balances } = useQuery<BalanceItem[]>({
    queryKey: ["bills", "balance"],
    queryFn: async () => {
      const res = await fetch("/api/bills/balance");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    enabled: status === "authenticated" && session?.user?.role === "MEMBER",
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("حصل خطأ، حاول تاني.");
      return res.json();
    },
    enabled: status === "authenticated" && session?.user?.role === "MEMBER",
  });

  const createBillMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...billForm,
          amount: parseFloat(billForm.amount),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setBillOpen(false);
      setBillForm({ category: "GAS", title: "", amount: "", billDate: "" });
    },
  });

  const settleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settleForm,
          amount: parseFloat(settleForm.amount),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "حصل خطأ، حاول تاني.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setSettleOpen(false);
      setSettleForm({ toUserId: "", amount: "" });
    },
  });

  if (status === "loading" || status === "unauthenticated") {
    return <Loading />;
  }

  if (session?.user?.role !== "MEMBER") {
    return <Loading />;
  }

  // Group bills by category
  const byCategory = (bills ?? []).reduce(
    (acc, bill) => {
      if (!acc[bill.category]) acc[bill.category] = [];
      acc[bill.category].push(bill);
      return acc;
    },
    {} as Record<string, Bill[]>
  );

  const categories = ["GAS", "ELECTRICITY", "WATER", "INTERNET"];

  // Collect all settlements across bills
  const allSettlements = (bills ?? [])
    .flatMap((b) => b.settlements ?? [])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const myBalance = balances?.find((b) => b.userId === session?.user?.id);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-teal">حسابات الشقة</h1>
        <div className="flex gap-2">
          <Dialog open={billOpen} onOpenChange={setBillOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Receipt className="w-4 h-4 ml-1" />
                سجّل فاتورة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>سجّل فاتورة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bill-cat">النوع</Label>
                  <select
                    id="bill-cat"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={billForm.category}
                    onChange={(e) =>
                      setBillForm({ ...billForm, category: e.target.value })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bill-title">العنوان</Label>
                  <Input
                    id="bill-title"
                    value={billForm.title}
                    onChange={(e) =>
                      setBillForm({ ...billForm, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bill-amount">المبلغ (ج.م)</Label>
                  <Input
                    id="bill-amount"
                    type="number"
                    value={billForm.amount}
                    onChange={(e) =>
                      setBillForm({ ...billForm, amount: e.target.value })
                    }
                    dir="ltr"
                    className="text-right"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bill-date">التاريخ</Label>
                  <Input
                    id="bill-date"
                    type="date"
                    value={billForm.billDate}
                    onChange={(e) =>
                      setBillForm({ ...billForm, billDate: e.target.value })
                    }
                  />
                </div>
                {createBillMutation.isError && (
                  <p className="text-sm text-destructive">
                    {createBillMutation.error?.message}
                  </p>
                )}
                <Button
                  onClick={() => createBillMutation.mutate()}
                  disabled={createBillMutation.isPending}
                  className="w-full"
                >
                  {createBillMutation.isPending ? "بيحفظ…" : "اتسجّل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                سدّد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسوية رصيد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="settle-to">للعضو</Label>
                  <select
                    id="settle-to"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={settleForm.toUserId}
                    onChange={(e) =>
                      setSettleForm({ ...settleForm, toUserId: e.target.value })
                    }
                  >
                    <option value="">اختر عضو</option>
                    {users
                      ?.filter((u) => u.id !== session?.user?.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settle-amount">المبلغ (ج.م)</Label>
                  <Input
                    id="settle-amount"
                    type="number"
                    value={settleForm.amount}
                    onChange={(e) =>
                      setSettleForm({ ...settleForm, amount: e.target.value })
                    }
                    dir="ltr"
                    className="text-right"
                  />
                </div>
                {settleMutation.isError && (
                  <p className="text-sm text-destructive">
                    {settleMutation.error?.message}
                  </p>
                )}
                <Button
                  onClick={() => settleMutation.mutate()}
                  disabled={
                    settleMutation.isPending ||
                    !settleForm.toUserId ||
                    !settleForm.amount
                  }
                  className="w-full"
                >
                  {settleMutation.isPending ? "بيحفظ…" : "اتسجّل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance dashboard */}
      <div className="mb-6 rounded-2xl bg-teal/5 border border-teal/10 p-4 space-y-3">
        {myBalance && (
          <p className="text-lg font-medium text-teal">
            رصيدك: {formatEGP(myBalance.balance)} ج.م
          </p>
        )}
        <Separator />
        <div className="grid gap-2 sm:grid-cols-2">
          {balances?.map((b) => (
            <div
              key={b.userId}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{b.name}</span>
              <span
                className={
                  b.balance > 0
                    ? "font-medium text-destructive"
                    : "font-medium text-teal"
                }
              >
                {formatEGP(b.balance)} ج.م
              </span>
            </div>
          ))}
        </div>
      </div>

      {billsLoading ? (
        <Loading />
      ) : !bills || bills.length === 0 ? (
        <EmptyState icon="💰" title="مفيش فواتير لسه" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((cat) => {
            const catBills = byCategory[cat] ?? [];
            const total = catBills.reduce(
              (sum, b) => sum + b.amount,
              0
            );
            return (
              <Card key={cat}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span aria-hidden>{CATEGORY_ICONS[cat]}</span>
                      {CATEGORY_LABELS[cat]}
                    </CardTitle>
                    {total > 0 && (
                      <Badge variant="secondary">
                        {formatEGP(total)} ج.م
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {catBills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      مفيش فواتير
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {catBills.map((bill) => (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between text-sm border-b border-border pb-1 last:border-0"
                        >
                          <div>
                            <p className="font-medium">{bill.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {bill.paidBy.name} —{" "}
                              {formatArabicDate(bill.billDate)}
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatEGP(bill.amount)} ج.م
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Settlements history */}
      {allSettlements.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-teal mb-3">
            سجل التسويات
          </h2>
          <div className="space-y-2">
            {allSettlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{s.fromUser.name}</span>
                  <span className="text-muted-foreground"> ← </span>
                  <span className="font-medium">{s.toUser.name}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="tea">{formatEGP(s.amount)} ج.م</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatArabicDate(s.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
