import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const decision = await prisma.decision.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        votes: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!decision || decision.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    return NextResponse.json(decision);
  } catch (error) {
    console.error("GET decision error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    if (session.user.role !== "MEMBER")
      return NextResponse.json({ error: "د للآعضاء بس" }, { status: 403 });

    const decision = await prisma.decision.findUnique({
      where: { id: params.id },
    });
    if (!decision || decision.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    await prisma.decision.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete decision error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    if (session.user.role !== "MEMBER")
      return NextResponse.json({ error: "د للآعضاء بس" }, { status: 403 });

    const body = await req.json();
    const { status } = body;

    if (!["PROPOSED", "APPROVED", "REJECTED", "IMPLEMENTED"].includes(status)) {
      return NextResponse.json({ error: "حالة مش صح" }, { status: 400 });
    }

    const decision = await prisma.decision.findUnique({
      where: { id: params.id },
    });
    if (!decision || decision.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    const updated = await prisma.decision.update({
      where: { id: params.id },
      data: { status },
      include: {
        createdBy: { select: { id: true, name: true } },
        votes: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Patch decision error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
