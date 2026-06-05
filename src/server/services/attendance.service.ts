import type { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";

export async function importFingerprintExcel(companyId: string, file: ArrayBuffer) {
  const workbook = XLSX.read(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const batch = await db.attendanceImportBatch.create({
    data: { companyId, totalRows: rows.length, status: "PROCESSING" }
  });

  const rawLogs = rows
    .map((row) => ({
      companyId,
      batchId: batch.id,
      fingerprintUserId: String(row.fingerprint_user_id ?? row.user_id ?? row.pin ?? ""),
      logTime: new Date(String(row.log_time ?? row.datetime ?? row.time)),
      deviceCode: row.device_code ? String(row.device_code) : null,
      rawPayload: row as Prisma.InputJsonObject
    }))
    .filter((row) => row.fingerprintUserId && !Number.isNaN(row.logTime.getTime()));

  await db.attendanceRawLog.createMany({ data: rawLogs });
  await db.attendanceImportBatch.update({
    where: { id: batch.id },
    data: {
      importedRows: rawLogs.length,
      errorRows: rows.length - rawLogs.length,
      status: "IMPORTED",
      processedAt: new Date()
    }
  });

  return { batchId: batch.id, total: rows.length, imported: rawLogs.length };
}
