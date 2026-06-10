import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFileWithContent } from "@/server/services/file.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  const file = await getFileWithContent(id);
  if (!file?.content) return NextResponse.json({ message: "File tidak ditemukan." }, { status: 404 });

  return new NextResponse(new Uint8Array(file.content.data), {
    headers: {
      "Content-Type": file.mimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
      "Cache-Control": "private, max-age=3600"
    }
  });
}
