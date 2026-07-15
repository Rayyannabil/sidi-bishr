import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations";
import { notifyAllUsers } from "@/lib/notifications";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { deletedAt: null },
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("GET events error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        date: new Date(parsed.data.date),
        location: parsed.data.location,
        coverImage: parsed.data.coverImage || null,
        type: parsed.data.type,
        createdById: session.user.id,
      },
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

    await notifyAllUsers({
      type: "NEW_EVENT",
      title: "حدث جديد",
      body: `${session.user.name} أنشأ حدث: ${parsed.data.title}`,
      link: "/events",
      excludeUserId: session.user.id,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST event error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
