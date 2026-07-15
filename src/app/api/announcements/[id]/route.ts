import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const editAnnouncementSchema = z.object({
  title: z.string().min(1, "اكتب عنوان").optional(),
  content: z.string().min(1, "اكتب محتوى").optional(),
  pinned: z.boolean().optional(),
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

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "حذف الإعلانات للأعضاء بس" },
        { status: 403 }
      );
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });
    if (!announcement || announcement.deletedAt) {
      return NextResponse.json({ error: "الإعلان مش موجود" }, { status: 404 });
    }

    await prisma.announcement.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete announcement error:", error);
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

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "تعديل الإعلانات للأعضاء بس" },
        { status: 403 }
      );
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });
    if (!announcement || announcement.deletedAt) {
      return NextResponse.json({ error: "الإعلان مش موجود" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = editAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.content !== undefined)
      updateData.content = parsed.data.content;
    if (parsed.data.pinned !== undefined) updateData.pinned = parsed.data.pinned;

    const updated = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Patch announcement error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
