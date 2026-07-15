import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settlementSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "د للآعضاء بس" },
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

    const { toUserId, amount } = parsed.data;
    const billId = params.id;

    // Verify bill exists
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      select: { id: true, deletedAt: true },
    });
    if (!bill || bill.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

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
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    // Create settlement and mark the fromUser's split on this bill as settled
    const [settlement] = await prisma.$transaction([
      prisma.settlement.create({
        data: {
          fromUserId: session.user.id,
          toUserId,
          billId,
          amount,
        },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      }),
      prisma.billSplit.updateMany({
        where: {
          billId,
          userId: session.user.id,
        },
        data: { settled: true },
      }),
    ]);

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
