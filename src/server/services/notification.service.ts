import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWhatsAppSettings } from "@/server/services/settings.service";
import { sendWhatsAppMessage } from "@/server/services/whatsapp.service";

export async function queueNotification(input: {
  companyId?: string;
  templateCode: string;
  recipientPhone?: string | null;
  payload: Record<string, string>;
}) {
  const settings = await getWhatsAppSettings(input.companyId);
  const recipientPhone = input.recipientPhone || settings.fallbackApprovalPhone;
  return db.notificationQueue.create({
    data: {
      companyId: input.companyId,
      templateCode: input.templateCode,
      recipientPhone,
      payload: input.payload as Prisma.InputJsonObject
    }
  });
}

export function renderTemplate(body: string, payload: Record<string, string>) {
  return Object.entries(payload).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value ?? ""),
    body
  );
}

export async function processQueuedNotification(id: string) {
  const item = await db.notificationQueue.findUnique({ where: { id } });
  if (!item || item.status !== "QUEUED") return;

  const template = item.templateCode
    ? await db.notificationTemplate.findFirst({
        where: {
          companyId: item.companyId ?? undefined,
          code: item.templateCode,
          channel: item.channel
        }
      })
    : null;

  const payload = item.payload as Record<string, string>;
  const message = template ? renderTemplate(template.body, payload) : payload.message;

  try {
    if (!item.recipientPhone) {
      throw new Error("Recipient phone kosong. Isi nomor approver atau fallback approval phone di Settings > WhatsApp.");
    }
    await sendWhatsAppMessage({ phone: item.recipientPhone ?? "", message });
    await db.notificationQueue.update({
      where: { id },
      data: { status: "SENT", attempts: { increment: 1 }, processedAt: new Date() }
    });
  } catch (error) {
    await db.notificationQueue.update({
      where: { id },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : "Unknown error",
        processedAt: new Date()
      }
    });
  }
}
