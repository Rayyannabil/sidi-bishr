import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "تغيير صلاحيات النشر للأعضاء بس" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, canPost: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: "المستخدم مش موجود" },
        { status: 404 }
      );
    }

    // Toggle canPost
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { canPost: !user.canPost },
      select: { id: true, name: true, canPost: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Patch posting-permission error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
