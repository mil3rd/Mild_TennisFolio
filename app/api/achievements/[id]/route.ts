import { eq } from "drizzle-orm";
import { getDb, achievements, type NewAchievement } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

const AGE_GROUPS = ["8-10", "12-14", "16-18"];

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/* PATCH /api/achievements/[id] — edit an existing achievement */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminRequest())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseId((await params).id);
    if (id === null) {
      return Response.json({ error: "Invalid achievement id" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<NewAchievement>;
    const { title, age_group, category, event_date, award, description, images } =
      body;

    if (!title || !age_group || !event_date || !award) {
      return Response.json(
        { error: "title, age_group, event_date, and award are required" },
        { status: 400 }
      );
    }

    if (!AGE_GROUPS.includes(age_group)) {
      return Response.json(
        { error: "age_group must be '8-10', '12-14', or '16-18'" },
        { status: 400 }
      );
    }

    const db = getDb();
    const [row] = await db
      .update(achievements)
      .set({
        title: title.trim(),
        age_group,
        category: category?.trim() || null,
        event_date,
        award: award.trim(),
        description: description?.trim() || null,
        images: images ?? [],
      })
      .where(eq(achievements.id, id))
      .returning();

    if (!row) {
      return Response.json({ error: "Achievement not found" }, { status: 404 });
    }

    return Response.json(row);
  } catch (err) {
    console.error("PATCH /api/achievements/[id] error:", err);
    return Response.json({ error: "Failed to update achievement" }, { status: 500 });
  }
}

/* DELETE /api/achievements/[id] — remove an achievement */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminRequest())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseId((await params).id);
    if (id === null) {
      return Response.json({ error: "Invalid achievement id" }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .delete(achievements)
      .where(eq(achievements.id, id))
      .returning();

    if (!row) {
      return Response.json({ error: "Achievement not found" }, { status: 404 });
    }

    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("DELETE /api/achievements/[id] error:", err);
    return Response.json({ error: "Failed to delete achievement" }, { status: 500 });
  }
}
