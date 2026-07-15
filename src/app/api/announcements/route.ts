import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncementSchema } from "@/lib/validations";
import { notifyAllUsers } from "@/lib/notifications";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { deletedAt: null },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("GET announcements error:", error);
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
        { error: "الإعلانات للأعضاء بس" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        authorId: session.user.id,
        title: parsed.data.title,
        content: parsed.data.content,
        pinned: parsed.data.pinned,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Notify all users about new announcement
    await notifyAllUsers({
      type: "NEW_ANNOUNCEMENT",
      title: "إعلان جديد",
      body: `${session.user.name} نشر إعلان: ${parsed.data.title}`,
      link: "/announcements",
      excludeUserId: session.user.id,
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("POST announcement error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
