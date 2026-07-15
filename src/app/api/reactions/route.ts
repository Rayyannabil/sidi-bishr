import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import type { ReactionType } from "@prisma/client";

const validReactions = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY", "FLIP"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const body = await req.json();
    const { type, postId, commentId } = body as {
      type: string;
      postId?: string;
      commentId?: string;
    };

    if (!validReactions.includes(type)) {
      return NextResponse.json({ error: "رياكشن مش صح" }, { status: 400 });
    }

    if (!postId && !commentId) {
      return NextResponse.json({ error: "حدد البوست أو الكومنت" }, { status: 400 });
    }

    // Check for existing reaction
    const where = postId
      ? { userId_postId: { userId: session.user.id, postId } }
      : { userId_commentId: { userId: session.user.id, commentId: commentId! } };

    const existing = await prisma.reaction.findUnique({ where });

    if (existing) {
      if (existing.type === type) {
        // Same reaction — remove it (toggle off)
        await prisma.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: "removed" });
      } else {
        // Different reaction — swap it
        await prisma.reaction.update({ where: { id: existing.id }, data: { type: type as ReactionType } });
        return NextResponse.json({ action: "swapped" });
      }
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        userId: session.user.id,
        type: type as ReactionType,
        postId: postId || null,
        commentId: commentId || null,
      },
    });

    // Notify the content author
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
      if (post && post.authorId !== session.user.id) {
        await createNotification({
          userId: post.authorId,
          type: "REACTION",
          title: "رياكشن جديد",
          body: `${session.user.name} تفاعل مع بوستك`,
          link: "/",
        });
      }
    }

    return NextResponse.json({ action: "created", reaction });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
