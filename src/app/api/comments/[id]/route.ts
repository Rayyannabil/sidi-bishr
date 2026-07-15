import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const editCommentSchema = z.object({
  content: z.string().min(1, "اكتب حاجة").max(1000, "طويل أوي"),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });
    if (!comment || comment.deletedAt) {
      return NextResponse.json({ error: "الكومنت مش موجود" }, { status: 404 });
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "مش مسموحلك" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = editCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await prisma.comment.update({
      where: { id: params.id },
      data: { content: parsed.data.content },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Patch comment error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });
    if (!comment || comment.deletedAt) {
      return NextResponse.json({ error: "الكومنت مش موجود" }, { status: 404 });
    }

    // Only author or member can delete
    if (comment.authorId !== session.user.id && session.user.role !== "MEMBER") {
      return NextResponse.json({ error: "مش مسموحلك" }, { status: 403 });
    }

    await prisma.comment.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
