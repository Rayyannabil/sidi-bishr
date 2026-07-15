import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { voteSchema } from "@/lib/validations";

export async function POST(
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
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );

    const decision = await prisma.decision.findUnique({
      where: { id: params.id },
    });
    if (!decision || decision.deletedAt)
      return NextResponse.json({ error: "مش موجود" }, { status: 404 });

    // Only allow voting on PROPOSED decisions
    if (decision.status !== "PROPOSED") {
      return NextResponse.json(
        { error: "التصويت مقفول على هذا القرار" },
        { status: 400 }
      );
    }

    // Upsert vote (one per member)
    const vote = await prisma.vote.upsert({
      where: {
        decisionId_userId: { decisionId: params.id, userId: session.user.id },
      },
      update: { choice: parsed.data.choice },
      create: {
        decisionId: params.id,
        userId: session.user.id,
        choice: parsed.data.choice,
      },
    });

    // Check threshold and update status
    const members = await prisma.user.findMany({
      where: { role: "MEMBER", deletedAt: null },
    });
    const votes = await prisma.vote.findMany({
      where: { decisionId: params.id },
    });

    const totalMembers = members.length;
    const yesVotes = votes.filter((v) => v.choice === "YES").length;
    const noVotes = votes.filter((v) => v.choice === "NO").length;
    const remaining = totalMembers - votes.length;
    const maxPossibleYes = yesVotes + remaining;

    let newStatus: string | null = null;

    if (decision.threshold === "UNANIMOUS") {
      // All members must vote YES
      if (noVotes > 0) {
        newStatus = "REJECTED";
      } else if (votes.length === totalMembers && yesVotes === totalMembers) {
        newStatus = "APPROVED";
      }
    } else if (decision.threshold === "TWO_THIRDS") {
      const needed = Math.ceil((2 / 3) * totalMembers); // 2 for 3 members
      if (maxPossibleYes < needed) {
        newStatus = "REJECTED";
      } else if (yesVotes >= needed) {
        newStatus = "APPROVED";
      }
    } else {
      // MAJORITY: >50% of total members
      const needed = Math.floor(totalMembers / 2) + 1; // 2 for 3 members
      if (maxPossibleYes < needed) {
        newStatus = "REJECTED";
      } else if (yesVotes >= needed) {
        newStatus = "APPROVED";
      }
    }

    if (newStatus) {
      await prisma.decision.update({
        where: { id: params.id },
        data: { status: newStatus as "APPROVED" | "REJECTED" },
      });
    }

    return NextResponse.json({ ...vote, decisionStatus: newStatus || decision.status });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني." }, { status: 500 });
  }
}
