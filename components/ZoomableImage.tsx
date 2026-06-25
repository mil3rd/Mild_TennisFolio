"use client";

import { useEffect, useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Renders an image that, when clicked, opens a full-screen lightbox showing the
 * photo centered on a dimmed backdrop. Close via the ✕ button, the backdrop, or
 * the Escape key.
 */
export default function ZoomableImage({ src, alt, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Prevent the page behind the lightbox from scrolling
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className={className}
        style={{ cursor: "zoom-in" }}
      />

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close image"
            className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 text-brown text-3xl leading-none hover:bg-white transition-colors shadow-lg"
          >
            ×
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
          />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
