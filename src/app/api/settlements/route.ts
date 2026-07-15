import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settlementSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "التسوية للأعضاء بس" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = settlementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { toUserId, amount, billId } = parsed.data;

    // Can't settle to yourself
    if (toUserId === session.user.id) {
      return NextResponse.json(
        { error: "مش ممكن تعمل تسوية لنفسك" },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, deletedAt: true },
    });
    if (!targetUser || targetUser.deletedAt) {
      return NextResponse.json(
        { error: "المستخدم مش موجود" },
        { status: 404 }
      );
    }

    // If billId provided, verify it exists and mark the split as settled
    if (billId) {
      const bill = await prisma.bill.findUnique({
        where: { id: billId },
        select: { id: true, deletedAt: true },
      });
      if (!bill || bill.deletedAt) {
        return NextResponse.json(
          { error: "الفاتورة مش موجودة" },
          { status: 404 }
        );
      }

      // Mark the fromUser's split on this bill as settled
      await prisma.billSplit.updateMany({
        where: {
          billId,
          userId: session.user.id,
        },
        data: { settled: true },
      });
    }

    const settlement = await prisma.settlement.create({
      data: {
        fromUserId: session.user.id,
        toUserId,
        billId: billId || null,
        amount,
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    // Serialize Decimal
    const serialized = {
      ...settlement,
      amount: Number(settlement.amount),
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error("POST settlement error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
