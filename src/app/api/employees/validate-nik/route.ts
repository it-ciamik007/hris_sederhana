import { NextResponse } from "next/server";
import { validateNik } from "@/server/services/nik.service";

export async function POST(request: Request) {
  return NextResponse.json(await validateNik(await request.json()));
}
