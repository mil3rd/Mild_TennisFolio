import type { HeroPhoto } from "@/lib/db";
import { HERO_SLOTS, type HeroSlot } from "@/lib/hero-frames";
import ZoomableImage from "./ZoomableImage";

interface Props {
  /** Pictures saved from the admin dashboard, keyed by frame slot. */
  photos?: HeroPhoto[];
}

/** Fixed scrapbook look per frame, so the layout never shifts between visits.
    Angle and offset live in `.hero-frame-{slot}` (globals.css), which can tune
    them per breakpoint; only size and tape colour vary from here. */
const FRAME_STYLE: Record<HeroSlot, { tape: string; size: string }> = {
  1: { tape: "", size: "w-32 md:w-36 xl:w-40" },
  2: { tape: "tape-pink", size: "w-32 lg:-ml-8" },
  3: { tape: "tape-green", size: "w-32 md:w-36" },
  4: { tape: "", size: "w-32 xl:w-36" },
};

function PhotoFrame({ slot, photo }: { slot: HeroSlot; photo?: HeroPhoto }) {
  const { tape, size } = FRAME_STYLE[slot];
  const caption = photo?.caption?.trim() ?? "";

  return (
    <figure
      className={`polaroid hero-frame hero-frame-${slot} ${size} shrink-0`}
    >
      <div className={`tape ${tape}`} />

      <div className="w-full aspect-[4/5] bg-mint-light overflow-hidden">
        {photo ? (
          <ZoomableImage
            src={photo.url}
            alt={caption || `Phassaree — photo ${slot}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="dashed-frame w-full h-full flex flex-col items-center justify-center gap-1 bg-cream/70 select-none">
            <span className="text-2xl opacity-40">🎾</span>
            <span className="font-dancing text-sm text-sage/60">
              photo {slot}
            </span>
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="mt-2 px-0.5 text-center font-dancing text-base leading-tight text-sage-dark line-clamp-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function HeroSection({ photos = [] }: Props) {
  const bySlot = new Map(photos.map((p) => [p.slot, p]));
  const frame = (slot: HeroSlot) => (
    <PhotoFrame key={slot} slot={slot} photo={bySlot.get(slot)} />
  );
  const [left, right] = [HERO_SLOTS.slice(0, 2), HERO_SLOTS.slice(2)];

  return (
    <section className="relative notebook-bg torn-bottom">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        {/* Decorative tennis elements */}
        <div className="absolute top-8 left-8 text-4xl rotate-[-15deg] opacity-25 select-none pointer-events-none">
          🎾
        </div>
        <div className="absolute top-12 right-12 text-3xl rotate-[20deg] opacity-20 select-none pointer-events-none">
          🏆
        </div>
        <div className="absolute bottom-20 left-16 text-2xl rotate-[10deg] opacity-15 select-none pointer-events-none">
          🥇
        </div>
        <div className="absolute bottom-16 right-10 text-3xl rotate-[-8deg] opacity-20 select-none pointer-events-none">
          🎾
        </div>

        {/* Photo frames flank the heading on desktop and sit below it on mobile */}
        <div className="flex flex-col items-center gap-10 md:flex-row md:justify-center md:gap-6 xl:gap-12">
          {/* Left pair: stacked on tablet, side by side and overlapping on desktop */}
          <div className="fade-up fade-up-4 order-2 flex justify-center gap-4 md:order-1 md:flex-col md:items-center md:gap-9 lg:flex-row lg:items-start lg:gap-2">
            {left.map(frame)}
          </div>

          <div className="order-1 text-center md:order-2 md:flex-1">
            {/* Main heading */}
            <div className="fade-up fade-up-1">
              <span className="font-dancing text-sage text-xl tracking-wide">
                — a scrapbook of —
              </span>
              <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-brown leading-tight mt-2 mb-4">
                Phassaree&apos;s
                <br />
                Tennis Archive
              </h1>
            </div>

            {/* Handwritten subtitle */}
            <div className="fade-up fade-up-2">
              <p className="font-dancing text-2xl text-sage-dark mb-8 leading-relaxed">
                &ldquo;Every swing, every win, every memory — pressed like
                flowers between pages ✦&rdquo;
              </p>
            </div>

            {/* CTA buttons */}
            <div className="fade-up fade-up-3 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#latest"
                className="font-lato font-semibold bg-sage text-cream px-7 py-3 rounded-full hover:bg-sage-dark transition-colors shadow-md tracking-wide text-sm"
              >
                View Latest Results
              </a>
              <a
                href="#archive"
                className="font-lato font-semibold border-2 border-sage text-sage px-7 py-3 rounded-full hover:bg-sage hover:text-cream transition-colors tracking-wide text-sm"
              >
                Browse Archive
              </a>
            </div>
          </div>

          {/* Right pair: runs down and to the right */}
          <div className="fade-up fade-up-5 order-3 flex justify-center gap-4 md:flex-col md:items-center md:gap-9">
            {right.map(frame)}
          </div>
        </div>
      </div>
    </section>
  );
}
