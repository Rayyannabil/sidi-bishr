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

    // Only members can pin/unpin
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "تثبيت البوستات للأعضاء بس" },
        { status: 403 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "البوست مش موجود" }, { status: 404 });
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data: { pinned: !post.pinned },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Pin post error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
