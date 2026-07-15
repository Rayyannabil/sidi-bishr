import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مسموش" }, { status: 401 });

  const body = await req.json();
  const { id } = body;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
