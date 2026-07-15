import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
  if (session.user.role !== "MEMBER") return NextResponse.json({ error: "د للآعضاء بس" }, { status: 403 });

  // Prevent self-demotion / self-deletion
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "مش تقدر تعدل دورك" }, { status: 400 });
  }

  const body = await req.json();
  const { role, deletedAt } = body;

  // Soft delete
  if (deletedAt) {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), role: "GUEST", canPost: false },
      select: { id: true, name: true },
    });
    return NextResponse.json(user);
  }

  if (!["MEMBER", "GUEST"].includes(role)) {
    return NextResponse.json({ error: "رتبة مش صح" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { role, canPost: role === "MEMBER" },
    select: { id: true, name: true, role: true },
  });

  return NextResponse.json(user);
}
