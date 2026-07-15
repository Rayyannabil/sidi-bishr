import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
  if (session.user.role !== "MEMBER") return NextResponse.json({ error: "د للآعضاء بس" }, { status: 403 });

  await prisma.badgeAssignment.update({
    where: { id: params.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
