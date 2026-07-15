import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validations";
import { notifyAllUsers } from "@/lib/notifications";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: {
          include: { user: { select: { id: true, name: true } } },
        },
        comments: {
          where: { deletedAt: null },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET posts error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    // Members can always post; guests need canPost permission
    if (session.user.role !== "MEMBER" && !session.user.canPost) {
      return NextResponse.json(
        { error: "لسه ماتقدرش تنشر هنا — اطلب من أحد الأعضاء يفتحلك النشر." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify all users about new post
    await notifyAllUsers({
      type: "NEW_POST",
      title: "بوست جديد",
      body: `${session.user.name} نشر بوست جديد`,
      link: "/",
      excludeUserId: session.user.id,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
