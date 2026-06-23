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

### 2. Admin can now EDIT / DELETE achievements — built, NOT yet fully verified
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

Verified: `npx tsc --noEmit` passes (exit 0). Login flow verified server-side via curl.

---

## 🔧 TODO — pick up here

### A. Fix the one remaining ESLint error (BLOCKER for clean lint)
`app/admin/page.tsx:96` — rule `react-hooks/set-state-in-effect`:
```js
useEffect(() => {
  refreshList();          // <-- flagged: setState inside effect
}, [refreshList]);
```
The state update actually happens **after** `await fetch(...)` (not synchronous), so this is a
conservative false-positive. Fix one of these ways:
- Simplest: add `// eslint-disable-next-line react-hooks/set-state-in-effect` above the call
  with a short justification comment, **or**
- Cleaner: move the fetch+`setList` into an inner `async` function declared inside the effect
  and call it (and consider an `AbortController` for cleanup).

Then confirm: `npx eslint app/admin/page.tsx` → 0 problems.

### B. Verify the new endpoints (was in progress, not finished)
Start dev server (avoid port clashes; `.env.local` is the source of truth, ADMIN_PASSWORD=`mild67`):
```bash
PORT=3939 npm run dev        # (background)
```
Then:
```bash
cd <scratchpad>
# 1. login → get cookie
curl -s -c cookies.txt -X POST localhost:3939/api/admin-auth \
  -H 'Content-Type: application/json' -d '{"password":"mild67"}'
# 2. list
curl -s -b cookies.txt localhost:3939/api/achievements | head
# 3. DELETE without cookie → expect 401
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE localhost:3939/api/achievements/1
# 4. DELETE with cookie → expect 200/404 (404 if id absent)
curl -s -b cookies.txt -X DELETE localhost:3939/api/achievements/999999
# 5. PATCH with cookie (use a real id from step 2)
curl -s -b cookies.txt -X PATCH localhost:3939/api/achievements/<ID> \
  -H 'Content-Type: application/json' \
  -d '{"title":"Edited","age_group":"12-14","event_date":"2024-01-01","award":"1st Place","images":[]}'
```
Also do a quick **browser** pass: log in, edit an item (change title + remove a photo + add one),
save, delete an item — confirm the homepage reflects changes.

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
