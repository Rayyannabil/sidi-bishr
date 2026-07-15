import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDecisionSchema } from "@/lib/validations";
import { notifyAllMembers } from "@/lib/notifications";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
  if (session.user.role !== "MEMBER") return NextResponse.json({ error: "د للآعضاء بس" }, { status: 403 });

  const decisions = await prisma.decision.findMany({
    where: { deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true } },
      votes: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(decisions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
  if (session.user.role !== "MEMBER") return NextResponse.json({ error: "د للآعضاء بس" }, { status: 403 });

  const body = await req.json();
  const parsed = createDecisionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const decision = await prisma.decision.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      threshold: parsed.data.threshold,
      createdById: session.user.id,
    },
  });

  await notifyAllMembers({
    type: "NEW_DECISION",
    title: "قرار جديد",
    body: `${session.user.name} اقترح: ${parsed.data.title}`,
    link: "/decisions",
    excludeUserId: session.user.id,
  });

  return NextResponse.json(decision, { status: 201 });
}
