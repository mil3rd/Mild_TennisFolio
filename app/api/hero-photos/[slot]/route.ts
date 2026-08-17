import { eq } from "drizzle-orm";
import { getDb, heroPhotos } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { pruneHeroImage } from "@/lib/hero-images";
import { parseHeroSlot } from "@/lib/hero-frames";

/* DELETE /api/hero-photos/[slot] — empty one frame back out */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slot: string }> }
) {
  try {
    if (!(await isAdminRequest())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slot = parseHeroSlot((await params).slot);
    if (slot === null) {
      return Response.json(
        { error: "slot must be 1, 2, 3, or 4" },
        { status: 400 }
      );
    }

    const db = getDb();
    const [row] = await db
      .delete(heroPhotos)
      .where(eq(heroPhotos.slot, slot))
      .returning();

    if (!row) {
      return Response.json({ error: "That frame is already empty" }, { status: 404 });
    }

    await pruneHeroImage(row.url);

    return Response.json({ ok: true, slot });
  } catch (err) {
    console.error("DELETE /api/hero-photos/[slot] error:", err);
    return Response.json(
      { error: "Failed to remove the hero photo" },
      { status: 500 }
    );
  }
}
