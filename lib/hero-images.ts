import { eq } from "drizzle-orm";
import { getDb, heroPhotos, images } from "@/lib/db";
import { HERO_IMAGE_URL } from "@/lib/hero-frames";

/**
 * Deletes the stored bytes behind a hero photo once no frame points at it any
 * more, so replacing or clearing a picture doesn't leave the `images` table
 * growing with orphans. Safe to call with any URL — non-uploaded URLs and
 * uploads still in use by another frame are left alone.
 */
export async function pruneHeroImage(url: string | null | undefined) {
  if (!url || !HERO_IMAGE_URL.test(url)) return;

  const id = url.slice(url.lastIndexOf("/") + 1);
  const db = getDb();

  const [stillUsed] = await db
    .select({ slot: heroPhotos.slot })
    .from(heroPhotos)
    .where(eq(heroPhotos.url, url))
    .limit(1);

  if (stillUsed) return;

  await db.delete(images).where(eq(images.id, id));
}
