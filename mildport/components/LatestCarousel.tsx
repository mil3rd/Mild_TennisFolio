"use client";

import { useState } from "react";
import type { Achievement } from "@/lib/db";
import AchievementCard from "./AchievementCard";

const TILT_MAP = ["l", "r", "n"] as const;
const TAPE_MAP = ["yellow", "pink", "green"] as const;
const PER_PAGE = 3;

export default function LatestCarousel({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const [page, setPage] = useState(0);

  if (achievements.length === 0) {
    return (
      <section id="latest" className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="font-dancing text-xl text-brown/50">
          No achievements yet — add some from the admin panel! 🎾
        </p>
      </section>
    );
  }

  const totalPages = Math.ceil(achievements.length / PER_PAGE);
  const slice = achievements.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <section id="latest" className="py-16 bg-cream">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        <div className="text-center mb-12">
          <p className="font-dancing text-sage text-lg">fresh from the courts</p>
          <h2 className="font-playfair text-3xl font-bold text-brown mt-1">
            Latest Results
          </h2>
          <div className="w-16 h-0.5 bg-mint mx-auto mt-4" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-start">
          {slice.map((a, i) => (
            <div key={a.id} className="flex justify-center">
              <div className="w-64">
                <AchievementCard
                  achievement={a}
                  variant="polaroid"
                  tilt={TILT_MAP[i % 3]}
                  tapeColor={TAPE_MAP[i % 3]}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            {/* Dot indicators */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Page ${i + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    i === page
                      ? "bg-sage scale-110"
                      : "bg-mint hover:bg-sage/50"
                  }`}
                />
              ))}
            </div>

            {/* Prev / Next arrows */}
            <div className="flex gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 rounded-full border-2 border-sage text-sage flex items-center justify-center text-lg hover:bg-sage hover:text-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                ‹
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-9 h-9 rounded-full border-2 border-sage text-sage flex items-center justify-center text-lg hover:bg-sage hover:text-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
