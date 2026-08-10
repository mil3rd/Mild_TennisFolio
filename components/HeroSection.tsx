export default function HeroSection() {
  return (
    <section className="relative notebook-bg torn-bottom">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
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

        {/* Main heading */}
        <div className="fade-up fade-up-1">
          <span className="font-dancing text-sage text-xl tracking-wide">
            — a scrapbook of —
          </span>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-brown leading-tight mt-2 mb-4">
            Phassaree&apos;s
            <br />
            Tennis Archive
          </h1>
        </div>

        {/* Handwritten subtitle */}
        <div className="fade-up fade-up-2">
          <p className="font-dancing text-2xl text-sage-dark mb-8 leading-relaxed">
            &ldquo;Every swing, every win, every memory — pressed like flowers between pages ✦&rdquo;
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
    </section>
  );
}
