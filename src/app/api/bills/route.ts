import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBillSchema } from "@/lib/validations";
import { notifyAllMembers } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "الفواتير للأعضاء بس" },
        { status: 403 }
      );
    }

    const bills = await prisma.bill.findMany({
      where: { deletedAt: null },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: true,
        settlements: {
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { billDate: "desc" },
    });

    // Fetch user names for splits separately (BillSplit has no user relation)
    const splitUserIds = new Set<string>();
    bills.forEach((b) => b.splits.forEach((s) => splitUserIds.add(s.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(splitUserIds) } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // Convert Decimal amounts to Number for JSON serialization
    const serialized = bills.map((bill) => ({
      ...bill,
      amount: Number(bill.amount),
      splits: bill.splits.map((s) => ({
        ...s,
        amount: Number(s.amount),
        userName: userMap.get(s.userId) || null,
      })),
      settlements: bill.settlements.map((s) => ({
        ...s,
        amount: Number(s.amount),
      })),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET bills error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "إنشاء الفواتير للأعضاء بس" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createBillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    // Get all active members for the split
    const members = await prisma.user.findMany({
      where: { role: "MEMBER", deletedAt: null },
      select: { id: true, name: true },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { error: "مفيش أعضاء لتقسيم الفاتورة" },
        { status: 400 }
      );
    }

    // Calculate split amount per member (round to 2 decimal places)
    const splitAmount = Math.ceil((parsed.data.amount / members.length) * 100) / 100;

    const bill = await prisma.bill.create({
      data: {
        category: parsed.data.category,
        title: parsed.data.title,
        amount: parsed.data.amount,
        billDate: new Date(parsed.data.billDate),
        paidById: session.user.id,
        splits: {
          create: members.map((m) => ({
            userId: m.id,
            amount: splitAmount,
          })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: true,
      },
    });

    // Notify all members about new bill
    await notifyAllMembers({
      type: "NEW_BILL",
      title: "فاتورة جديدة",
      body: `${session.user.name} أضاف فاتورة: ${parsed.data.title} (${parsed.data.amount} جنيه)`,
      link: "/bills",
      excludeUserId: session.user.id,
    });

    // Build user name map for splits
    const userMap = new Map(members.map((m) => [m.id, m.name]));

    // Serialize Decimal fields
    const serialized = {
      ...bill,
      amount: Number(bill.amount),
      splits: bill.splits.map((s) => ({
        ...s,
        amount: Number(s.amount),
        userName: userMap.get(s.userId) || null,
      })),
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error("POST bill error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
