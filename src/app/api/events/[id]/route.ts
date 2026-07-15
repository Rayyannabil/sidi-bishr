import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const editEventSchema = z.object({
  title: z.string().min(1, "اكتب عنوان").optional(),
  description: z.string().min(1, "اكتب وصف").optional(),
  date: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "تاريخ مش صح")
    .optional(),
  location: z.string().min(1, "اكتب مكان").optional(),
  coverImage: z.string().url().optional().nullable(),
  type: z.enum(["HANGOUT", "IFTAR"]).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        memories: {
          where: { deletedAt: null },
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event || event.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("GET event error:", error);
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

    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "د للآعضاء بس" },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    await prisma.event.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete event error:", error);
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

    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "د للآعضاء بس" },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = editEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      updateData.description = parsed.data.description;
    if (parsed.data.date !== undefined)
      updateData.date = new Date(parsed.data.date);
    if (parsed.data.location !== undefined)
      updateData.location = parsed.data.location;
    if (parsed.data.coverImage !== undefined)
      updateData.coverImage = parsed.data.coverImage || null;
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true } },
        memories: {
          where: { deletedAt: null },
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Patch event error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
