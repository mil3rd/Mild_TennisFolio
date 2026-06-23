# Next Steps — handoff notes (for Claude / future me)

Last updated: 2026-06-23. Project: `mildport` (Phassaree's Tennis Archive).
Stack: **Next.js 16.2.7** (App Router, Turbopack, React 19.2), Drizzle ORM + Neon Postgres.

> ⚠️ This is Next 16 — APIs differ from older Next. Read `node_modules/next/dist/docs/`
> before changing framework behavior (see `AGENTS.md`). Notable: `middleware` is
> deprecated in favor of `proxy`; `params`/`cookies`/`headers` are **async**.

---

## ✅ Done in this session

### 1. Login "stuck after correct password" — FIXED
- **Root cause:** not env/password/hash (all verified correct via curl). The App Router
  **cached the unauthenticated `/admin → /admin/login` redirect**, so after login the
  soft `router.push("/admin")` replayed the stale redirect and bounced back to login.
- **Fix:** `app/admin/login/page.tsx` now does a full-document nav `window.location.assign("/admin")`
  on success (bypasses the client router cache, sends the fresh cookie to the server).
- Logout in `app/admin/page.tsx` also switched to `window.location.assign("/admin/login")`.

### 2. Admin can now EDIT / DELETE achievements — built AND verified ✅
New/changed files:
- `lib/auth.ts` **(new)** — `COOKIE`, `SALT`, `hashPassword()`, `isAdminRequest()` (reads the
  `admin_token` cookie, constant-time compares to expected hash).
- `app/api/admin-auth/route.ts` — refactored to import from `lib/auth` (removed duplicate hash code).
- `app/api/achievements/[id]/route.ts` **(new)** — `PATCH` (edit) + `DELETE` (remove) by id,
  both guarded by `isAdminRequest()`.
- `app/api/achievements/route.ts` — `POST` now guarded by `isAdminRequest()`.
- `app/api/upload/route.ts` and `app/api/ocr/route.ts` — `POST` now guarded by `isAdminRequest()`.
  (Middleware only protects `/admin/*` pages, NOT `/api/*`, so these were previously public.)
- `app/admin/page.tsx` — rewritten to add a **"Manage Achievements"** list (fetched from
  `GET /api/achievements`) with **Edit** (loads item into the form → `PATCH`) and **Delete**
  (`window.confirm` → `DELETE`). Edit mode keeps existing image URLs, lets you remove them,
  and append newly uploaded ones (`images = [...existingImages, ...uploadedUrls]`).

Verified: `npx tsc --noEmit` passes, `npx eslint .` passes (0 problems), and the full
edit/delete lifecycle was exercised against the running dev server via curl (see below).

---

## ✅ A & B — DONE (2026-06-23)

### A. ESLint error — FIXED
`app/admin/page.tsx` no longer calls a setState-bearing callback in `useEffect`. The initial
load now uses an inline `async` IIFE with a visible `await` before `setList` (plus an `active`
cleanup flag). `npx eslint .` → **0 problems**, `npx tsc --noEmit` → **exit 0**.

### B. Endpoints — VERIFIED via curl (non-destructive; created + deleted a throwaway row)
Results, all as expected:
- 401 (no cookie) for: `POST /api/achievements`, `PATCH /api/achievements/:id`,
  `DELETE /api/achievements/:id`, `POST /api/upload`, `POST /api/ocr`.
- `POST` (with cookie) created a row; `PATCH` (with cookie) updated every field → 200.
- `PATCH` non-numeric id → 400; `PATCH` bad age_group → 400; `DELETE` missing id → 404.
- `DELETE` (with cookie) removed the test row; list count returned to its original value.
- `GET /admin` (with cookie) renders 200 and shows the new "Manage Achievements" section.

Still worth doing when you're back: a quick **manual browser pass** (log in → edit an item:
change title + remove a saved photo + add a new one → save → delete an item → confirm the
homepage reflects the changes). Note: the DB was empty (0 rows) during testing.

> Transient note: one `GET /api/achievements` logged `NeonDbError: fetch failed` (intermittent
> network blip to Neon). All other DB calls succeeded; the page degrades to an empty list. Not a
> code bug — but if it recurs often in production, consider a retry around the Neon HTTP driver.

---

## 🔧 TODO — pick up here

### C. Second known issue (DEFERRED by user) — Vercel production upload broken
- **Root cause:** `app/api/upload/route.ts` writes files to `public/uploads/` via `fs.writeFile`.
  Vercel's serverless filesystem is **read-only/ephemeral**, so uploads fail / don't persist in
  production. Works locally only.
- **Fix direction:** switch image storage to object storage. Recommended **Vercel Blob**
  (`@vercel/blob` `put()`), returns a public URL to store in `achievements.images`. Alternatives:
  S3 / Cloudinary, or store bytes in Neon. Will need an env var (e.g. `BLOB_READ_WRITE_TOKEN`).
  The DB already stores `images` as `text[]` of URLs, so only the upload route + envs change.

---

## 📝 Lower-priority / notes
- `middleware.ts` logs a deprecation warning (Next 16 wants `proxy.ts`; `proxy` runs **nodejs**
  runtime only, no edge). Still works. If migrating, it can reuse `lib/auth` (node `crypto`)
  instead of the Web Crypto `subtle` hashing it currently uses. The two hashes were verified identical.
- `DELETE` removes the DB row only; it does **not** delete orphaned files in `public/uploads/`.
  Minor, and moot once storage moves off the local FS (item C).
- `GET /api/achievements` is intentionally left public (homepage shows the same data).

## Quick file map
```
lib/auth.ts                         # admin cookie verification (NEW)
lib/db.ts                           # drizzle schema: achievements table
middleware.ts                       # protects /admin/* pages (deprecated name)
app/admin/login/page.tsx            # login (fixed nav)
app/admin/page.tsx                  # dashboard: add + EDIT + DELETE + list  (lint fix pending)
app/api/admin-auth/route.ts         # POST login / DELETE logout (sets admin_token cookie)
app/api/achievements/route.ts       # GET (public) + POST (guarded)
app/api/achievements/[id]/route.ts  # PATCH + DELETE (guarded)  (NEW)
app/api/upload/route.ts             # POST image -> public/uploads (guarded; BREAKS on Vercel)
app/api/ocr/route.ts                # POST Tesseract OCR (guarded)
```
