import { prisma } from "./prisma";

export async function createNotification(params: {
  userId: string;
  type: import("@prisma/client").NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}

// Create notifications for all members
export async function notifyAllMembers(params: {
  type: import("@prisma/client").NotificationType;
  title: string;
  body: string;
  link?: string;
  excludeUserId?: string;
}) {
  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      deletedAt: null,
      id: params.excludeUserId ? { not: params.excludeUserId } : undefined,
    },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.id,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    })),
  });
}

// Create notifications for all users (guests + members)
export async function notifyAllUsers(params: {
  type: import("@prisma/client").NotificationType;
  title: string;
  body: string;
  link?: string;
  excludeUserId?: string;
}) {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      id: params.excludeUserId ? { not: params.excludeUserId } : undefined,
    },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    })),
  });
}
