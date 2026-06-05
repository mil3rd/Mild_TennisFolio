import type { Achievement } from "@/lib/db";
import AchievementCard from "./AchievementCard";

interface AgeGroupConfig {
  label: string;
  tag: string;
  accent: string; // Tailwind bg class for the pill header
  textColor: string;
}

const GROUPS: Record<string, AgeGroupConfig> = {
  "8-10": {
    label: "8–10 years",
    tag: "little champion 🌱",
    accent: "bg-mint",
    textColor: "text-sage-dark",
  },
  "12-14": {
    label: "12–14 years",
    tag: "rising star ⭐",
    accent: "bg-sage",
    textColor: "text-cream",
  },
  "16-18": {
    label: "16–18 years",
    tag: "elite player 🏆",
    accent: "bg-parchment",
    textColor: "text-brown",
  },
};

interface Props {
  ageGroup: "8-10" | "12-14" | "16-18";
  achievements: Achievement[];
}

export default function AgeGroupSection({ ageGroup, achievements }: Props) {
  const config = GROUPS[ageGroup];

  return (
    <section className="py-14 bg-beige/40">
      <div className="max-w-6xl mx-auto px-6">
        {/* Pill header that bleeds from left edge */}
        <div className="mb-8 -ml-6 pl-6">
          <div
            className={`pill-header ${config.accent} ${config.textColor} shadow-sm`}
            style={{ paddingLeft: "1.5rem" }}
          >
            {config.label}
            <span className="font-lato text-sm font-normal ml-3 opacity-80">
              {config.tag}
            </span>
          </div>
        </div>

        {achievements.length === 0 ? (
          <div className="dashed-frame py-12 text-center">
            <p className="font-dancing text-xl text-brown/40">
              No entries yet for this age group
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} variant="card" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
