import { desc } from "drizzle-orm";
import { getDb, achievements, type NewAchievement } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(achievements)
      .orderBy(desc(achievements.created_at));
    return Response.json(rows);
  } catch (err) {
    console.error("GET /api/achievements error:", err);
    return Response.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, age_group, category, event_date, award, description, images } =
      body as NewAchievement;

    if (!title || !age_group || !event_date || !award) {
      return Response.json(
        { error: "title, age_group, event_date, and award are required" },
        { status: 400 }
      );
    }

    if (!["8-10", "12-14", "16-18"].includes(age_group as string)) {
      return Response.json(
        { error: "age_group must be '8-10', '12-14', or '16-18'" },
        { status: 400 }
      );
    }

    const db = getDb();
    const [row] = await db
      .insert(achievements)
      .values({
        title: title.trim(),
        age_group,
        category: category?.trim() || null,
        event_date,
        award: award.trim(),
        description: description?.trim() || null,
        images: images ?? [],
      })
      .returning();

    return Response.json(row, { status: 201 });
  } catch (err) {
    console.error("POST /api/achievements error:", err);
    return Response.json({ error: "Failed to save achievement" }, { status: 500 });
  }
}
