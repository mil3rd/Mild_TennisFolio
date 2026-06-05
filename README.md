# Phassaree's Tennis Archive

A scrapbook-aesthetic tennis portfolio built with Next.js, Neon DB, and Drizzle ORM — everything runs free.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Neon DB** — free serverless PostgreSQL
- **Drizzle ORM** — type-safe SQL
- **Tailwind CSS v4** — scrapbook colour theme + utility classes
- **Tesseract.js** — OCR to auto-fill forms from certificate images
- **Google Fonts** — Playfair Display, Dancing Script, Lato

---

## Quick Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get a free Neon DB URL

1. Sign up at [neon.tech](https://neon.tech) (free, no credit card)
2. Create a project, copy the **Connection string**

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Paste your connection string into `.env.local`:

```
DATABASE_URL=postgres://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Push the schema to Neon

```bash
npm run db:push
```

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The homepage loads immediately even with an empty database.

---

## Adding Achievements

Go to [http://localhost:3000/admin](http://localhost:3000/admin):

1. **(Optional)** Upload a certificate image — Tesseract.js OCR auto-extracts tournament name, date, award, and category
2. Edit the pre-filled form fields as needed
3. Add photos via drag-and-drop
4. Click **Save Achievement** — entry appears on the homepage immediately

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to Neon |
| `npm run db:studio` | Open Drizzle Studio (visual DB GUI) |

---

## Free Deployment on Vercel

1. Push your repo to GitHub
2. Import at [vercel.com](https://vercel.com) → **New Project**
3. Add `DATABASE_URL` in **Settings → Environment Variables**
4. Deploy

> **Image uploads on Vercel:** Vercel's filesystem is ephemeral; uploaded photos won't persist across deployments. For production, swap the upload route with [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (free tier) or any S3-compatible service.

---

## Project Structure

```
app/
├── globals.css           Tailwind v4 @theme + scrapbook utilities
├── layout.tsx            Root layout, Google Fonts
├── page.tsx              Homepage (server component)
├── admin/page.tsx        Admin dashboard (client component)
└── api/
    ├── achievements/     GET all / POST new
    ├── upload/           POST image → /public/uploads/
    └── ocr/              POST image → Tesseract OCR

components/
├── Navbar.tsx
├── HeroSection.tsx       Notebook-paper hero with stats
├── LatestCarousel.tsx    Paginated polaroid carousel (client)
├── AgeGroupSection.tsx   Per age-group card grid
├── AchievementCard.tsx   Polaroid + standard card variants
└── Footer.tsx

lib/
└── db.ts                 Neon driver, Drizzle schema, getDb()
```
