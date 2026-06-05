import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-parchment shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-dancing text-2xl text-sage-dark font-bold tracking-wide hover:text-sage transition-colors"
        >
          Phassaree ✦
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a
            href="#latest"
            className="font-lato text-sm text-brown hover:text-sage transition-colors tracking-wide"
          >
            Latest
          </a>
          <a
            href="#archive"
            className="font-lato text-sm text-brown hover:text-sage transition-colors tracking-wide"
          >
            Archive
          </a>
          <Link
            href="/admin"
            className="font-lato text-sm bg-sage text-cream px-4 py-1.5 rounded-full hover:bg-sage-dark transition-colors tracking-wide shadow-sm"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
