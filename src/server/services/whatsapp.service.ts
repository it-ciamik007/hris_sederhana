import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWhatsAppSettings, saveWhatsAppSettings } from "@/server/services/settings.service";

export type WhatsAppMessageInput = {
  phone: string;
  message: string;
  type?: "text" | "image" | "reply";
  imageUrl?: string;
  quotedMessageId?: string;
};

export async function sendWhatsAppMessage(input: WhatsAppMessageInput) {
  const wamConfig = await getWhatsAppSettings();
  if (!wamConfig.apiKey) throw new Error("WAM API key belum dikonfigurasi di Settings > WhatsApp.");

  const body: Record<string, string> = {
    phone: input.phone,
    message: input.message,
    type: input.type ?? "text"
  };

  if (input.imageUrl) body.image_url = input.imageUrl;
  if (input.quotedMessageId) body.quoted_message_id = input.quotedMessageId;

  const response = await fetch(`${wamConfig.baseUrl}/api/v1/message/send`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": wamConfig.apiKey
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  await db.whatsAppMessageLog.create({
    data: {
      instanceId: result?.data?.instance_id ?? wamConfig.instanceId,
      phone: input.phone,
      message: input.message,
      type: input.type ?? "text",
      status: result?.success ? "sent" : "failed",
      providerRaw: result as Prisma.InputJsonObject,
      errorMessage: result?.success ? null : result?.message,
      sentAt: result?.success ? new Date() : null
    }
  });

  if (!response.ok || !result?.success) {
    throw new Error(result?.message ?? "WhatsApp message failed.");
  }

  return result;
}

export async function getWhatsAppInstanceStatus() {
  const wamConfig = await getWhatsAppSettings();
  if (!wamConfig.apiKey) return { status: "not_configured" };
  const response = await fetch(`${wamConfig.baseUrl}/api/v1/instance/status`, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": wamConfig.apiKey
    }
  });
  return response.json();
}

export async function createWhatsAppInstance(input: { name: string; webhookUrl?: string }) {
  const wamConfig = await getWhatsAppSettings();
  const response = await fetch(`${wamConfig.baseUrl}/api/v1/public/instance/create`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: input.name,
      webhook_url: input.webhookUrl || undefined
    })
  });

  const result = await response.json();
  if (!response.ok || !result?.success) {
    throw new Error(result?.message ?? "Create WhatsApp instance failed.");
  }

  await saveWhatsAppSettings(null, {
    ...wamConfig,
    apiKey: result.data?.api_key ?? wamConfig.apiKey,
    instanceId: result.data?.instance_id ?? wamConfig.instanceId
  });

  return result;
}

export async function generateWhatsAppQr() {
  const wamConfig = await getWhatsAppSettings();
  if (!wamConfig.apiKey || !wamConfig.instanceId) {
    throw new Error("API key dan instance ID wajib diisi.");
  }
  const response = await fetch(`${wamConfig.baseUrl}/api/v1/instance/${wamConfig.instanceId}/qr`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-API-KEY": wamConfig.apiKey
    }
  });
  return response.json();
}

export async function generateWhatsAppPairingCode(phoneNumber?: string) {
  const wamConfig = await getWhatsAppSettings();
  if (!wamConfig.apiKey || !wamConfig.instanceId) {
    throw new Error("API key dan instance ID wajib diisi.");
  }
  const phone = phoneNumber || wamConfig.pairingPhone;
  if (!phone) throw new Error("Nomor pairing wajib diisi.");

  const response = await fetch(`${wamConfig.baseUrl}/api/v1/instance/${wamConfig.instanceId}/pairing-code`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": wamConfig.apiKey
    },
    body: JSON.stringify({ phone_number: phone })
  });
  return response.json();
}

export async function processWhatsAppWebhook(payload: unknown) {
  await db.whatsAppMessageLog.create({
    data: {
      phone: "unknown",
      message: JSON.stringify(payload),
      direction: "incoming",
      status: "received",
      providerRaw: payload as Prisma.InputJsonValue
    }
  });
}
