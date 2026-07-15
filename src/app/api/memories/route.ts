import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMemorySchema } from "@/lib/validations";

export async function GET() {
  try {
    const memories = await prisma.memory.findMany({
      where: { deletedAt: null },
      include: {
        event: { select: { id: true, title: true, date: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(memories);
  } catch (error) {
    console.error("GET memories error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "رفع الذكريات للأعضاء بس" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createMemorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: parsed.data.eventId },
      select: { id: true, deletedAt: true },
    });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: "الحدث مش موجود" }, { status: 404 });
    }

    const memory = await prisma.memory.create({
      data: {
        eventId: parsed.data.eventId,
        uploadedById: session.user.id,
        url: parsed.data.url,
        caption: parsed.data.caption || null,
        type: parsed.data.type,
      },
      include: {
        event: { select: { id: true, title: true, date: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    console.error("POST memory error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
