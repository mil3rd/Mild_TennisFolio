import { asc, eq, sql } from "drizzle-orm";
import { getDb, heroPhotos } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { pruneHeroImage } from "@/lib/hero-images";
import {
  HERO_CAPTION_MAX,
  HERO_IMAGE_URL,
  parseHeroSlot,
} from "@/lib/hero-frames";

/* GET /api/hero-photos — the pictures currently shown in the hero frames */
export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(heroPhotos)
      .orderBy(asc(heroPhotos.slot));
    return Response.json(rows);
  } catch (err) {
    console.error("GET /api/hero-photos error:", err);
    return Response.json(
      { error: "Failed to fetch hero photos" },
      { status: 500 }
    );
  }
}

/* PUT /api/hero-photos — set (or replace) the picture in one frame */
export async function PUT(request: Request) {
  try {
    if (!(await isAdminRequest())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      slot?: unknown;
      url?: unknown;
      caption?: unknown;
    };

    const slot = parseHeroSlot(body.slot);
    if (slot === null) {
      return Response.json(
        { error: "slot must be 1, 2, 3, or 4" },
        { status: 400 }
      );
    }

    // Only accept paths produced by /api/upload — the picture has to live in
    // the database for it to survive on Vercel's ephemeral filesystem.
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!HERO_IMAGE_URL.test(url)) {
      return Response.json(
        { error: "url must be an uploaded image path (/api/images/…)" },
        { status: 400 }
      );
    }

    const caption =
      typeof body.caption === "string"
        ? body.caption.trim().slice(0, HERO_CAPTION_MAX) || null
        : null;

    const db = getDb();

    const [previous] = await db
      .select()
      .from(heroPhotos)
      .where(eq(heroPhotos.slot, slot))
      .limit(1);

    const [row] = await db
      .insert(heroPhotos)
      .values({ slot, url, caption })
      .onConflictDoUpdate({
        target: heroPhotos.slot,
        set: { url, caption, updated_at: sql`now()` },
      })
      .returning();

    if (previous && previous.url !== url) {
      await pruneHeroImage(previous.url);
    }

    return Response.json(row);
  } catch (err) {
    console.error("PUT /api/hero-photos error:", err);
    return Response.json(
      { error: "Failed to save the hero photo" },
      { status: 500 }
    );
  }
}
