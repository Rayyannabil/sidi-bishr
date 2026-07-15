import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBadgeSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مسموش" }, { status: 401 });

  const badges = await prisma.badgeAssignment.findMany({
    where: { revokedAt: null },
    include: {
      awardedBy: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(badges);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
  if (session.user.role !== "MEMBER") return NextResponse.json({ error: "د للآعضاء بس" }, { status: 403 });

  const body = await req.json();
  const parsed = createBadgeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const badge = await prisma.badgeAssignment.create({
    data: {
      text: parsed.data.text,
      awardedById: session.user.id,
      recipientId: parsed.data.recipientId,
    },
  });

  await createNotification({
    userId: parsed.data.recipientId,
    type: "NEW_BADGE",
    title: "وسام جديد!",
    body: `${session.user.name} منحك وسام: ${parsed.data.text}`,
    link: "/profile",
  });

  return NextResponse.json(badge, { status: 201 });
}
