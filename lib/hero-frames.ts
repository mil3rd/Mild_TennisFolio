/**
 * Shared constants for the four photo frames in the homepage hero.
 *
 * Kept free of database imports so both the server (API routes, hero section)
 * and the client (admin dashboard) can pull from it.
 */

/** Frame positions, in the order they appear around the hero heading. */
export const HERO_SLOTS = [1, 2, 3, 4] as const;

export type HeroSlot = (typeof HERO_SLOTS)[number];

/** Matches the URL shape handed back by POST /api/upload. */
export const HERO_IMAGE_URL = /^\/api\/images\/[A-Za-z0-9_-]+$/;

/** Caption length cap — matches the varchar(120) column. */
export const HERO_CAPTION_MAX = 120;

export function isHeroSlot(value: unknown): value is HeroSlot {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= HERO_SLOTS.length
  );
}

/** Parses a raw route/body value into a valid slot number, or null. */
export function parseHeroSlot(raw: unknown): HeroSlot | null {
  const slot = Number(raw);
  return isHeroSlot(slot) ? slot : null;
}
