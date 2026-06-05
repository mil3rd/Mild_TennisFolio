export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LatestCarousel from "@/components/LatestCarousel";
import AgeGroupSection from "@/components/AgeGroupSection";
import Footer from "@/components/Footer";
import { getDb, achievements, type Achievement } from "@/lib/db";

type FetchResult = { data: Achievement[]; setupNeeded: boolean };

async function fetchAchievements(): Promise<FetchResult> {
  if (!process.env.DATABASE_URL) {
    return { data: [], setupNeeded: true };
  }
  try {
    const db = getDb();
    const data = await db
      .select()
      .from(achievements)
      .orderBy(desc(achievements.created_at));
    return { data, setupNeeded: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Table not created yet — silent, expected during first-time setup
    const tablesMissing =
      msg.includes("does not exist") ||
      msg.includes("relation") ||
      msg.includes("Failed query");
    if (!tablesMissing) console.error("[DB]", msg);
    return { data: [], setupNeeded: tablesMissing };
  }
}

function computeStats(all: Achievement[]) {
  const tournaments = all.length;
  const wins = all.filter((a) =>
    /1st|first|gold|champion|winner/i.test(a.award)
  ).length;

  const earliest = all.reduce<string | null>((acc, a) => {
    if (!acc || a.event_date < acc) return a.event_date;
    return acc;
  }, null);

  const years = earliest
    ? new Date().getFullYear() - new Date(earliest).getFullYear()
    : 0;

  return { years: Math.max(years, 0), tournaments, wins };
}

export default async function HomePage() {
  const { data: all, setupNeeded } = await fetchAchievements();

  const latest = all.slice(0, 6);
  const group8 = all.filter((a) => a.age_group === "8-10");
  const group12 = all.filter((a) => a.age_group === "12-14");
  const group16 = all.filter((a) => a.age_group === "16-18");
  const stats = computeStats(all);

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Setup banner — only shown when DB table is missing */}
        {setupNeeded && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-center">
            <p className="font-lato text-sm text-amber-800">
              <strong>One step left:</strong> run{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">
                npm run db:push
              </code>{" "}
              in your terminal to create the database table, then refresh.
            </p>
          </div>
        )}

        {/* Hero */}
        <HeroSection stats={stats} />

        {/* Latest Results Carousel */}
        <LatestCarousel achievements={latest} />

        {/* Divider */}
        <div
          id="archive"
          className="flex items-center gap-4 max-w-6xl mx-auto px-6 py-8"
        >
          <div className="flex-1 h-px bg-mint/60" />
          <span className="font-dancing text-2xl text-sage">✦ by age ✦</span>
          <div className="flex-1 h-px bg-mint/60" />
        </div>

        {/* Age Group Sections */}
        <AgeGroupSection ageGroup="8-10" achievements={group8} />
        <AgeGroupSection ageGroup="12-14" achievements={group12} />
        <AgeGroupSection ageGroup="16-18" achievements={group16} />
      </main>

      <Footer />
    </>
  );
}
