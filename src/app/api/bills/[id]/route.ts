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

    // Members only
    if (session.user.role !== "MEMBER") {
      return NextResponse.json(
        { error: "حذف الفواتير للأعضاء بس" },
        { status: 403 }
      );
    }

    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
    });
    if (!bill || bill.deletedAt) {
      return NextResponse.json({ error: "الفاتورة مش موجودة" }, { status: 404 });
    }

    await prisma.bill.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bill error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
