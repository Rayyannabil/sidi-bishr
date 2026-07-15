import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resetRequestSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "إيميل مش صح" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // In production, send email. For now, return token for dev.
    return NextResponse.json({ success: true, token, message: "اتبع اتبعتلك رابط التغيير" });
  } catch (error) {
    console.error("Reset request error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
