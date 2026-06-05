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

  const mainImage = images?.[0];

  if (variant === "polaroid") {
    return (
      <div
        className={`polaroid polaroid-tilt-${tilt} cursor-default select-none`}
      >
        {/* Washi tape */}
        <div
          className={`tape ${tapeColor === "pink" ? "tape-pink" : tapeColor === "green" ? "tape-green" : ""}`}
        />

        {/* Photo area */}
        <div className="w-full aspect-[4/3] bg-mint-light overflow-hidden mb-3">
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
        </div>

        {/* Polaroid caption area */}
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

  /* ── Card variant ── */
  return (
    <div className="bg-white rounded-lg border border-parchment shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Image */}
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
        <span
          className={`award-badge ${badgeClass(award)} absolute top-3 right-3 shadow-sm`}
        >
          {award}
        </span>
      </div>

      {/* Body */}
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
}
