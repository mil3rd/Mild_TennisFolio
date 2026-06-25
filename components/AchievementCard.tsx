"use client";

import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Achievement } from "@/lib/db";

type Variant = "polaroid" | "card";

interface Props {
  achievement: Achievement;
  variant?: Variant;
  tilt?: "l" | "r" | "n";
  tapeColor?: "yellow" | "pink" | "green";
}

function badgeClass(award: string) {
  const a = award.toLowerCase();
  if (/1st|first|gold|champion|winner/.test(a)) return "badge-gold";
  if (/2nd|second|silver|runner/.test(a)) return "badge-silver";
  return "badge-sage";
}

function formatDate(d: string) {
  try {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export default function AchievementCard({
  achievement,
  variant = "card",
  tilt = "n",
  tapeColor = "yellow",
}: Props) {
  const { title, award, event_date, category, images, description } =
    achievement;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const mainImage = images?.[0];
  const galleryImages = useMemo(() => {
    const validImages = (images ?? []).filter(
      (img): img is string => Boolean(img)
    );
    if (validImages.length > 0) return validImages;
    return mainImage ? [mainImage] : [];
  }, [images, mainImage]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpen = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex(0);
      setIsOpen(true);
    }
  };

  const renderCardContent = () => {
    if (variant === "polaroid") {
      return (
        <div
          className={`polaroid polaroid-tilt-${tilt} cursor-pointer select-none`}
        >
          <div
            className={`tape ${tapeColor === "pink" ? "tape-pink" : tapeColor === "green" ? "tape-green" : ""}`}
          />

          <div className="w-full aspect-[4/3] bg-mint-light overflow-hidden mb-3 relative">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🎾
              </div>
            )}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-cream font-lato">
                {galleryImages.length} photos
              </div>
            )}
          </div>

          <div className="text-center px-1">
            <span className={`award-badge ${badgeClass(award)} mb-2`}>
              {award}
            </span>
            <p className="font-playfair text-sm font-semibold text-brown leading-tight mt-1 line-clamp-2">
              {title}
            </p>
            {category && (
              <p className="font-dancing text-xs text-sage mt-0.5">{category}</p>
            )}
            <p className="font-lato text-[10px] text-brown/50 mt-1">
              {formatDate(event_date)}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-parchment shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
        <div className="aspect-video bg-mint-light overflow-hidden relative">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🎾
            </div>
          )}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-cream font-lato">
              {galleryImages.length} photos
            </div>
          )}
          <span
            className={`award-badge ${badgeClass(award)} absolute top-3 right-3 shadow-sm`}
          >
            {award}
          </span>
        </div>

        <div className="p-4">
          <p className="font-playfair font-semibold text-base text-brown line-clamp-2 leading-snug">
            {title}
          </p>
          {category && (
            <p className="font-dancing text-sage text-sm mt-0.5">{category}</p>
          )}
          <p className="font-lato text-xs text-brown/50 mt-2">
            {formatDate(event_date)}
          </p>
          {description && (
            <p className="font-lato text-xs text-brown/70 mt-2 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="focus:outline-none focus:ring-2 focus:ring-sage/40 focus:ring-offset-2"
        onClick={() => {
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={handleOpen}
      >
        {renderCardContent()}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col p-3 sm:p-5 lg:p-6">
            <div className="mb-3 flex items-center justify-between rounded-full bg-white/95 px-4 py-2 shadow-sm">
              <div>
                <p className="font-playfair text-sm font-semibold text-brown">
                  {title}
                </p>
                <p className="font-lato text-[11px] text-brown/60">
                  Tap through the moments and read the story below
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-parchment bg-cream px-3 py-1.5 text-sm text-brown transition hover:bg-mint-light"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex h-full min-h-0 flex-nowrap overflow-x-auto snap-x snap-mandatory md:flex-row md:overflow-visible">
                <div className="flex w-full shrink-0 flex-col bg-cream/70 p-3 sm:p-4 md:flex-1 md:w-auto md:p-6">
                  <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-[22px] bg-[#f7f2e8]">
                    {galleryImages.length > 0 ? (
                      <img
                        src={galleryImages[activeIndex]}
                        alt={`${title} ${activeIndex + 1}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl">
                        🎾
                      </div>
                    )}
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                      {galleryImages.map((img, index) => (
                        <button
                          key={`${img}-${index}`}
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-white shadow-sm snap-start ${
                            index === activeIndex
                              ? "border-sage"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${title} thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex w-full shrink-0 flex-col border-t border-parchment bg-white p-4 sm:p-5 md:w-[360px] md:border-l md:border-t-0 md:flex-shrink-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`award-badge ${badgeClass(award)}`}>
                      {award}
                    </span>
                    {galleryImages.length > 1 && (
                      <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-lato text-brown/70">
                        {activeIndex + 1}/{galleryImages.length}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-playfair text-2xl font-semibold text-brown">
                    {title}
                  </h3>
                  {category && (
                    <p className="mt-1 font-dancing text-sage">{category}</p>
                  )}
                  <p className="mt-2 font-lato text-sm text-brown/60">
                    {formatDate(event_date)}
                  </p>

                  {description && (
                    <p className="mt-4 whitespace-pre-line font-lato text-sm leading-relaxed text-brown/75">
                      {description}
                    </p>
                  )}

                  {galleryImages.length > 1 && (
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex((current) =>
                            current === 0 ? galleryImages.length - 1 : current - 1
                          )
                        }
                        className="flex-1 rounded-full border border-sage px-3 py-2 text-sm font-lato text-sage transition hover:bg-sage hover:text-cream"
                      >
                        ← Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex((current) =>
                            current === galleryImages.length - 1 ? 0 : current + 1
                          )
                        }
                        className="flex-1 rounded-full border border-sage px-3 py-2 text-sm font-lato text-sage transition hover:bg-sage hover:text-cream"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
