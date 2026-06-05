import { NextResponse } from "next/server";
import { createEmployee, listEmployees } from "@/server/services/employee.service";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json(
    await listEmployees({
      q: url.searchParams.get("q") ?? "",
      page: Number(url.searchParams.get("page") ?? 1)
    })
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("form")
    ? Object.fromEntries(await request.formData())
    : await request.json();

  try {
    await createEmployee(input, session?.id);
    return NextResponse.redirect(new URL("/employees", request.url));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Create employee failed" },
      { status: 400 }
    );
  }
}
