import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { content, parentId, postId } = body as { content: string; parentId?: string; postId: string };

    if (!postId) {
      return NextResponse.json({ error: "البوست مش موجود" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: session.user.id,
        content,
        parentId: parentId || null,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    // Notify post author
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post && post.authorId !== session.user.id) {
      await createNotification({
        userId: post.authorId,
        type: "NEW_COMMENT",
        title: "كومنت جديد",
        body: `${session.user.name} كومنت على بوستك`,
        link: "/",
      });
    }

    // If it's a reply, notify the parent comment author
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
      if (parent && parent.authorId !== session.user.id) {
        await createNotification({
          userId: parent.authorId,
          type: "REPLY_TO_COMMENT",
          title: "رد على كومنتك",
          body: `${session.user.name} رد على كومنتك`,
          link: "/",
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
