import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "الأرصدة للأعضاء بس" },
        { status: 403 }
      );
    }

    // Get all active members
    const members = await prisma.user.findMany({
      where: { role: "MEMBER", deletedAt: null },
      select: { id: true, name: true },
    });

    // For each member, calculate outstanding balance:
    // balance = sum of their unsettled splits - sum of their settlements
    const balances = await Promise.all(
      members.map(async (member) => {
        // Sum of unsettled splits owed by this member
        const unsettledSplits = await prisma.billSplit.aggregate({
          where: {
            userId: member.id,
            settled: false,
            bill: { deletedAt: null },
          },
          _sum: { amount: true },
        });

        // Sum of settlements made by this member
        const settlementsMade = await prisma.settlement.aggregate({
          where: { fromUserId: member.id },
          _sum: { amount: true },
        });

        const owed = Number(unsettledSplits._sum.amount || 0);
        const paid = Number(settlementsMade._sum.amount || 0);
        const balance = owed - paid;

        return {
          userId: member.id,
          name: member.name,
          owed,
          paid,
          balance,
        };
      })
    );

    return NextResponse.json(balances);
  } catch (error) {
    console.error("GET balance error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
