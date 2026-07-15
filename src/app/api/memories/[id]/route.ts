import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموش" }, { status: 401 });
    }

    const memory = await prisma.memory.findUnique({
      where: { id: params.id },
    });
    if (!memory || memory.deletedAt) {
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });
    }

    // Members only, OR the uploader can delete their own memory
    const isMember = session.user.role === "MEMBER";
    const isUploader = memory.uploadedById === session.user.id;

    if (!isMember && !isUploader) {
      return NextResponse.json(
        { error: "د للآعضاء بس" },
        { status: 403 }
      );
    }

    await prisma.memory.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete memory error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
