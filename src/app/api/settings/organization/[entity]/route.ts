import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  assertEntity,
  createOrganizationEntity,
  deleteHoliday,
  toggleOrganizationEntity,
  updateOrganizationEntity
} from "@/server/services/organization.service";

export async function POST(request: Request, context: { params: Promise<{ entity: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  try {
    const entity = assertEntity((await context.params).entity);
    const form = Object.fromEntries(await request.formData()) as Record<string, string>;
    const action = form._action ?? "create";

    if (action === "create") {
      await createOrganizationEntity(entity, form, session.id);
    } else if (action === "update") {
      if (!form.id) throw new Error("ID wajib disertakan.");
      await updateOrganizationEntity(entity, form.id, form, session.id);
    } else if (action === "toggle") {
      if (!form.id) throw new Error("ID wajib disertakan.");
      await toggleOrganizationEntity(entity, form.id, form.isActive === "1", session.id);
    } else if (action === "delete" && entity === "holidays") {
      if (!form.id) throw new Error("ID wajib disertakan.");
      await deleteHoliday(form.id, session.id);
    } else {
      throw new Error(`Aksi tidak dikenal: ${action}`);
    }

    return NextResponse.redirect(new URL(`/settings/organization?tab=${entity}`, request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Operasi master data gagal" },
      { status: 400 }
    );
  }
}
