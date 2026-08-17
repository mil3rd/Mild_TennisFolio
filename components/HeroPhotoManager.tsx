"use client";

import { useCallback, useEffect, useState } from "react";
import type { HeroPhoto } from "@/lib/db";
import { HERO_CAPTION_MAX, HERO_SLOTS, type HeroSlot } from "@/lib/hero-frames";

type PhotoMap = Partial<Record<HeroSlot, HeroPhoto>>;

/**
 * Manages the four picture frames in the homepage hero: upload a photo, swap it
 * for another, retitle it, or clear the frame. Every action writes straight to
 * the database, so the homepage picks the change up on its next load.
 */
export default function HeroPhotoManager() {
  const [photos, setPhotos] = useState<PhotoMap>({});
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [busySlot, setBusySlot] = useState<HeroSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const applyRows = useCallback((rows: HeroPhoto[]) => {
    const next: PhotoMap = {};
    const nextCaptions: Record<number, string> = {};
    for (const row of rows) {
      next[row.slot as HeroSlot] = row;
      nextCaptions[row.slot] = row.caption ?? "";
    }
    setPhotos(next);
    setCaptions(nextCaptions);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/hero-photos");
        if (!active) return;
        if (!res.ok) throw new Error();
        const rows = (await res.json()) as HeroPhoto[];
        if (active) applyRows(rows);
      } catch {
        if (active) {
          setError(
            "Couldn't load the frames. On a fresh database, run `npm run db:push` first."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyRows]);

  /** Writes one frame (picture + caption) and folds the saved row back in. */
  const save = async (slot: HeroSlot, url: string, caption: string) => {
    const res = await fetch("/api/hero-photos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, url, caption }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Save failed");

    const row = json as HeroPhoto;
    setPhotos((prev) => ({ ...prev, [slot]: row }));
    setCaptions((prev) => ({ ...prev, [slot]: row.caption ?? "" }));
  };

  const handleFile = async (slot: HeroSlot, file: File) => {
    if (!file.type.startsWith("image/")) return;
    setBusySlot(slot);
    setError("");
    setNotice("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      await save(slot, json.url, captions[slot] ?? "");
      setNotice(`Frame ${slot} updated — it's live on the homepage.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusySlot(null);
    }
  };

  const handleCaptionSave = async (slot: HeroSlot) => {
    const photo = photos[slot];
    if (!photo) return;
    setBusySlot(slot);
    setError("");
    setNotice("");
    try {
      await save(slot, photo.url, captions[slot] ?? "");
      setNotice(`Frame ${slot} caption saved.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusySlot(null);
    }
  };

  const handleRemove = async (slot: HeroSlot) => {
    if (!window.confirm(`Remove the photo in frame ${slot}?`)) return;
    setBusySlot(slot);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/hero-photos/${slot}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Delete failed");
      }
      setPhotos((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      setCaptions((prev) => ({ ...prev, [slot]: "" }));
      setNotice(`Frame ${slot} is empty again.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusySlot(null);
    }
  };

  return (
    <section className="mb-10 p-6 bg-white rounded-xl border border-parchment shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">🖼️</span>
        <div>
          <h2 className="font-playfair text-lg font-semibold text-brown">
            Hero Photo Frames
          </h2>
          <p className="text-xs text-brown/60 mt-0.5">
            The four frames beside the title on the homepage — upload, swap, or
            clear each one. Changes show up right away.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-mint-light text-sage-dark border border-mint">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-brown/50">Loading frames…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {HERO_SLOTS.map((slot) => {
            const photo = photos[slot];
            const busy = busySlot === slot;
            const caption = captions[slot] ?? "";
            const captionDirty = photo
              ? caption.trim() !== (photo.caption ?? "")
              : false;

            return (
              <div
                key={slot}
                className="rounded-lg border border-parchment p-3 flex flex-col gap-2.5"
              >
                <p className="font-lato text-xs font-semibold text-brown/70 uppercase tracking-wide">
                  Frame {slot}
                </p>

                <div className="w-full max-w-[9rem] mx-auto aspect-[4/5] rounded-md overflow-hidden bg-mint-light/50 border border-parchment flex items-center justify-center">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.url}
                      alt={photo.caption ?? `Frame ${slot}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl opacity-40">🎾</span>
                  )}
                </div>

                <input
                  type="text"
                  value={caption}
                  maxLength={HERO_CAPTION_MAX}
                  disabled={!photo || busy}
                  placeholder="Caption (optional)"
                  onChange={(e) =>
                    setCaptions((prev) => ({ ...prev, [slot]: e.target.value }))
                  }
                  className="input-base text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {captionDirty && (
                  <button
                    type="button"
                    onClick={() => handleCaptionSave(slot)}
                    disabled={busy}
                    className="text-xs font-semibold text-sage hover:text-sage-dark border border-sage/40 hover:border-sage py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    Save caption
                  </button>
                )}

                <div className="flex gap-2">
                  <label
                    className={`flex-1 text-center text-xs font-semibold py-1.5 rounded-full border transition-colors ${
                      busy
                        ? "opacity-50 cursor-wait border-parchment text-brown/50"
                        : "cursor-pointer border-sage/40 text-sage hover:border-sage hover:text-sage-dark"
                    }`}
                  >
                    {busy
                      ? "Working…"
                      : photo
                        ? "Change photo"
                        : "Upload photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(slot, file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {photo && (
                    <button
                      type="button"
                      onClick={() => handleRemove(slot)}
                      disabled={busy}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
