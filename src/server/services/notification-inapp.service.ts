import { db } from "@/lib/db";

type NotifyInput = {
  title: string;
  body: string;
  link?: string;
};

export async function notifyUser(input: NotifyInput & { userId: string }) {
  await db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      link: input.link
    }
  });
}

export async function notifyEmployee(input: NotifyInput & { employeeId: string }) {
  const users = await db.user.findMany({
    where: { employeeId: input.employeeId, isActive: true },
    select: { id: true }
  });
  if (!users.length) return;

  await db.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: input.title,
      body: input.body,
      link: input.link
    }))
  });
}

export async function notifyRole(input: NotifyInput & { roleCode: string }) {
  const users = await db.user.findMany({
    where: { isActive: true, roles: { some: { role: { code: input.roleCode } } } },
    select: { id: true }
  });
  if (!users.length) return;

  await db.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: input.title,
      body: input.body,
      link: input.link
    }))
  });
}
