import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reactionSchema = z.object({
  type: z.enum(["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY", "FLIP"]),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "رياكشن مش صح" },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, deletedAt: true },
    });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: "البوست مش موجود" }, { status: 404 });
    }

    // Check if user already has a reaction on this post — swap if exists
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: params.id,
        },
      },
    });

    if (existing) {
      // Swap reaction type
      const updated = await prisma.reaction.update({
        where: { id: existing.id },
        data: { type: parsed.data.type },
        include: { user: { select: { id: true, name: true } } },
      });
      return NextResponse.json(updated);
    }

    const reaction = await prisma.reaction.create({
      data: {
        userId: session.user.id,
        postId: params.id,
        type: parsed.data.type,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error("Reaction error:", error);
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

    await prisma.reaction.deleteMany({
      where: {
        userId: session.user.id,
        postId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete reaction error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
