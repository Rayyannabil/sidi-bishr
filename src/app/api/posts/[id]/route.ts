import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const editPostSchema = z.object({
  content: z.string().min(1, "اكتب حاجة").max(2000, "طويل أوي").optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "البوست مش موجود" }, { status: 404 });
    }

    // Only author or member can delete
    if (post.authorId !== session.user.id && session.user.role !== "MEMBER") {
      return NextResponse.json({ error: "مش مسموحلك" }, { status: 403 });
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "البوست مش موجود" }, { status: 404 });
    }

    // Only author or member can edit
    if (post.authorId !== session.user.id && session.user.role !== "MEMBER") {
      return NextResponse.json({ error: "مش مسموحلك" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = editPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const updateData: { content?: string; imageUrl?: string | null } = {};
    if (parsed.data.content !== undefined) {
      updateData.content = parsed.data.content;
    }
    if (parsed.data.imageUrl !== undefined) {
      updateData.imageUrl = parsed.data.imageUrl || null;
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Patch post error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
