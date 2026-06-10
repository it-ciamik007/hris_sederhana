import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 15
    }),
    db.notification.count({ where: { userId: session.id, readAt: null } })
  ]);

  return NextResponse.json({ items, unreadCount });
}

const markReadSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional()
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  try {
    const input = markReadSchema.parse(await request.json());
    await db.notification.updateMany({
      where: {
        userId: session.id,
        readAt: null,
        ...(input.all ? {} : { id: input.id ?? "" })
      },
      data: { readAt: new Date() }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
