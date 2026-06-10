import path from "path";
import { db } from "@/lib/db";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function saveUploadedFile(input: { file: File; companyId?: string | null; uploadedBy?: string | null }) {
  const { file } = input;
  if (!file.size) throw new Error("File kosong.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Ukuran file maksimal 5 MB.");
  }
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error("Format file harus JPG, PNG, WebP, atau PDF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name || "");
  const storedName = `${crypto.randomUUID()}${extension}`;

  return db.$transaction(async (tx) => {
    const record = await tx.file.create({
      data: {
        companyId: input.companyId,
        originalName: file.name || storedName,
        storedName,
        mimeType: file.type,
        sizeBytes: BigInt(file.size),
        storageProvider: "DB",
        storagePath: "db",
        uploadedBy: input.uploadedBy
      }
    });
    await tx.fileContent.create({ data: { fileId: record.id, data: buffer } });
    return record;
  });
}

export async function getFileWithContent(id: string) {
  return db.file.findUnique({ where: { id }, include: { content: true } });
}
