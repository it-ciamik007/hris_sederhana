import path from "path";

export type StorageProvider = "LOCAL" | "S3";

export function getLocalStorageRoot() {
  return path.resolve(process.env.LOCAL_STORAGE_ROOT ?? "./storage/uploads");
}

export function buildStoredName(originalName: string) {
  const extension = path.extname(originalName);
  return `${crypto.randomUUID()}${extension}`;
}
