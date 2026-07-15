import { PrismaClient, Role, EventType, ReactionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Sidi Bishr Apartment...");

  // Hash passwords
  const passHash = await bcrypt.hash("password123", 10);

  // ─── 3 Members ──────────────────────────────────────
  const rayyan = await prisma.user.create({
    data: {
      name: "Rayyan Nabil",
      email: "rayyan@example.com",
      passwordHash: passHash,
      role: Role.MEMBER,
      canPost: true,
    },
  });

  const youssef = await prisma.user.create({
    data: {
      name: "Youssef Eid",
      email: "youssef@example.com",
      passwordHash: passHash,
      role: Role.MEMBER,
      canPost: true,
    },
  });

  const steven = await prisma.user.create({
    data: {
      name: "Steven Gerges",
      email: "steven@example.com",
      passwordHash: passHash,
      role: Role.MEMBER,
      canPost: true,
    },
  });

  // ─── Guest ──────────────────────────────────────────
  const guest = await prisma.user.create({
    data: {
      name: "أحمد الضيف",
      email: "ahmed@example.com",
      passwordHash: passHash,
      role: Role.GUEST,
      canPost: false,
    },
  });

  console.log("✅ Users created (3 members + 1 guest)");

  // ─── Posts ──────────────────────────────────────────
  const post1 = await prisma.post.create({
    data: {
      authorId: rayyan.id,
      content: "أهلاً بيك في شقة سيدي بشر! أول بوست في الونس 🍵",
      pinned: true,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: youssef.id,
      content: "عاملين إزاية النهاردة؟ حد فاكر نعمل شاي النهاردة ولا إيه؟",
    },
  });

  const post3 = await prisma.post.create({
    data: {
      authorId: steven.id,
      content: "الشقة شكلها حلو أوي بعد التنظيم. تسلم الأيادي 👏",
    },
  });

  // ─── Comments ────────────────────────────────────────
  const comment1 = await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: rayyan.id,
      content: "يلا نعمل شاي! أنا جهزت النعناع 🌿",
    },
  });

  await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: steven.id,
      content: "وأنا هجيب السكر",
      parentId: comment1.id,
    },
  });

  // ─── Reactions ───────────────────────────────────────
  await prisma.reaction.create({
    data: { userId: youssef.id, postId: post1.id, type: ReactionType.LOVE },
  });
  await prisma.reaction.create({
    data: { userId: steven.id, postId: post1.id, type: ReactionType.LIKE },
  });
  await prisma.reaction.create({
    data: { userId: guest.id, postId: post3.id, type: ReactionType.LIKE },
  });

  // ─── Event (hangout) ────────────────────────────────
  const event1 = await prisma.event.create({
    data: {
      title: "لمة الأسبوع",
      description: "لمة أسبوعية على فنجان شاي وكورة",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "شقة سيدي بشر",
      type: EventType.HANGOUT,
      createdById: rayyan.id,
    },
  });

  // ─── Annual Iftar Event ──────────────────────────────
  const iftar = await prisma.event.create({
    data: {
      title: "إفطار شقة سيدي بشر — أكبر لمّة في السنة",
      description: "إفطار رمضاني سنوي بيجمع كل الأصحاب والرواد. مكانش ينفع تفوت!",
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: "شقة سيدي بشر - صالة الاستقبال",
      type: EventType.IFTAR,
      createdById: rayyan.id,
    },
  });

  // ─── Memories ───────────────────────────────────────
  await prisma.memory.create({
    data: {
      eventId: event1.id,
      uploadedById: rayyan.id,
      url: "https://images.unsplash.com/photo-1514119412350-e174dfb5dbd0?w=800",
      caption: "لمة الأسبوع الماضي 🍵",
      type: "image",
    },
  });

  await prisma.memory.create({
    data: {
      eventId: event1.id,
      uploadedById: youssef.id,
      url: "https://images.unsplash.com/photo-1559526324-4b87b5e36ad4?w=800",
      caption: "الشاي كان على آخره",
      type: "image",
    },
  });

  // ─── Announcement ───────────────────────────────────
  await prisma.announcement.create({
    data: {
      authorId: rayyan.id,
      title: "مرحباً بيك في الشقة!",
      content: "دي شقة سيدي بشر — مكان الأصحاب والشاي والذكريات. تشرفونا!",
      pinned: true,
    },
  });

  // ─── Bill (Gas) ──────────────────────────────────────
  const bill1 = await prisma.bill.create({
    data: {
      category: "GAS",
      title: "فاتورة الغاز - يوليو",
      amount: 900,
      billDate: new Date(),
      paidById: rayyan.id,
      splits: {
        create: [
          { userId: rayyan.id, amount: 300 },
          { userId: youssef.id, amount: 300 },
          { userId: steven.id, amount: 300 },
        ],
      },
    },
  });

  // ─── Bill (Electricity) ─────────────────────────────
  await prisma.bill.create({
    data: {
      category: "ELECTRICITY",
      title: "كهرباء - يوليو",
      amount: 1500,
      billDate: new Date(),
      paidById: youssef.id,
      splits: {
        create: [
          { userId: rayyan.id, amount: 500 },
          { userId: youssef.id, amount: 500 },
          { userId: steven.id, amount: 500 },
        ],
      },
    },
  });

  // ─── Settlement (Steven paid Rayyan back) ───────────
  await prisma.settlement.create({
    data: {
      fromUserId: steven.id,
      toUserId: rayyan.id,
      billId: bill1.id,
      amount: 300,
    },
  });

  // ─── Decision ───────────────────────────────────────
  const decision1 = await prisma.decision.create({
    data: {
      title: "شراء تليفزيون جديد للصالة",
      description: "التليفزيون القديم خلص حياته. نقترح نشتري واحد جديد 55 بوصة. رأيكم؟",
      threshold: "MAJORITY",
      createdById: rayyan.id,
    },
  });

  await prisma.vote.create({
    data: { decisionId: decision1.id, userId: rayyan.id, choice: "YES" },
  });
  await prisma.vote.create({
    data: { decisionId: decision1.id, userId: youssef.id, choice: "YES" },
  });

  // ─── Badge ──────────────────────────────────────────
  await prisma.badgeAssignment.create({
    data: {
      text: "وسام أحسن صانع شاي",
      awardedById: rayyan.id,
      recipientId: guest.id,
    },
  });

  await prisma.badgeAssignment.create({
    data: {
      text: "وسام النظافة والترتيب",
      awardedById: youssef.id,
      recipientId: guest.id,
    },
  });

  // ─── Notifications ───────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: guest.id,
      type: "NEW_BADGE",
      title: "وسام جديد!",
      body: "Rayyan Nabil منحك وسام: وسام أحسن صانع شاي",
      link: "/profile",
    },
  });

  await prisma.notification.create({
    data: {
      userId: youssef.id,
      type: "NEW_POST",
      title: "بوست جديد",
      body: "Rayyan Nabil نشر بوست جديد",
      link: "/",
    },
  });

  console.log("✅ Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("  Rayyan:  rayyan@example.com / password123");
  console.log("  Youssef: youssef@example.com / password123");
  console.log("  Steven:  steven@example.com / password123");
  console.log("  Guest:   ahmed@example.com / password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
