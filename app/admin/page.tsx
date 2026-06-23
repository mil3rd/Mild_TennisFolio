"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { Achievement } from "@/lib/db";

/* ── Types ── */
interface ExtractedData {
  title?: string;
  award?: string;
  eventDate?: string;
  category?: string;
}

interface FormState {
  title: string;
  age_group: string;
  category: string;
  event_date: string;
  award: string;
  description: string;
}

type Status = "idle" | "ocr" | "saving" | "success" | "error";

const INITIAL_FORM: FormState = {
  title: "",
  age_group: "",
  category: "",
  event_date: "",
  award: "",
  description: "",
};

/* ── Helpers ── */
function badgeClass(award: string) {
  if (!award) return "badge-sage";
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
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

/* ── Component ── */
export default function AdminPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [ocrRaw, setOcrRaw] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  /* Manage / edit state */
  const [list, setList] = useState<Achievement[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await fetch("/api/admin-auth", { method: "DELETE" });
    // Hard navigation so the cleared cookie takes effect server-side and no
    // stale authenticated /admin page lingers in the client router cache.
    window.location.assign("/admin/login");
  };

  /* ── Load the existing achievements ── */
  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/achievements");
      if (!res.ok) return;
      setList((await res.json()) as Achievement[]);
    } catch {
      /* non-fatal — the list just stays empty */
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  /* ── Field change ── */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── OCR ── */
  const handleOcrFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setStatus("ocr");
    setStatusMsg("Running OCR… this may take a moment");
    setOcrRaw("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "OCR failed");

      const ex: ExtractedData = json.extracted ?? {};
      setOcrRaw(json.text ?? "");
      setForm((prev) => ({
        ...prev,
        title: ex.title ?? prev.title,
        award: ex.award ?? prev.award,
        event_date: ex.eventDate ?? prev.event_date,
        category: ex.category ?? prev.category,
      }));
      setStatus("idle");
      setStatusMsg("OCR complete — review and edit the fields below");
    } catch (err: unknown) {
      setStatus("error");
      setStatusMsg(
        err instanceof Error ? err.message : "OCR failed, please fill manually"
      );
    }
  }, []);

  /* ── Photos ── */
  const addPhotos = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    const newUrls = images.map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...images]);
    setPhotoUrls((prev) => [...prev, ...newUrls]);
  }, []);

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photoUrls[i]);
    setPhotos((prev) => prev.filter((_, j) => j !== i));
    setPhotoUrls((prev) => prev.filter((_, j) => j !== i));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  /* ── Drag-and-drop on photo zone ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  const handleDragLeave = () => setIsDraggingOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    addPhotos(Array.from(e.dataTransfer.files));
  };

  /* ── Reset to a clean "add" state ── */
  const resetForm = () => {
    setForm(INITIAL_FORM);
    photoUrls.forEach((u) => URL.revokeObjectURL(u));
    setPhotos([]);
    setPhotoUrls([]);
    setExistingImages([]);
    setOcrRaw("");
    setEditingId(null);
  };

  /* ── Enter edit mode for an existing achievement ── */
  const handleEdit = (a: Achievement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      age_group: a.age_group,
      category: a.category ?? "",
      event_date: a.event_date,
      award: a.award,
      description: a.description ?? "",
    });
    photoUrls.forEach((u) => URL.revokeObjectURL(u));
    setPhotos([]);
    setPhotoUrls([]);
    setExistingImages(a.images ?? []);
    setOcrRaw("");
    setStatus("idle");
    setStatusMsg("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    resetForm();
    setStatus("idle");
    setStatusMsg("");
  };

  /* ── Delete an achievement ── */
  const handleDelete = async (a: Achievement) => {
    if (
      !window.confirm(`Delete "${a.title}"? This cannot be undone.`)
    )
      return;
    setDeletingId(a.id);
    try {
      const res = await fetch(`/api/achievements/${a.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Delete failed");
      }
      if (editingId === a.id) resetForm();
      setStatus("success");
      setStatusMsg(`"${a.title}" deleted.`);
      await refreshList();
    } catch (err: unknown) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Submit (create or update) ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.age_group || !form.event_date || !form.award) {
      setStatus("error");
      setStatusMsg("Please fill in all required fields.");
      return;
    }

    setStatus("saving");
    setStatusMsg(photos.length ? "Uploading photos…" : "Saving…");

    try {
      /* 1. Upload any newly-added photos */
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        const fd = new FormData();
        fd.append("file", photo);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        uploadedUrls.push(json.url);
      }
      const images = [...existingImages, ...uploadedUrls];

      setStatusMsg(editingId ? "Updating achievement…" : "Saving achievement…");

      /* 2. Create or update */
      const payload = {
        title: form.title.trim(),
        age_group: form.age_group,
        category: form.category.trim() || null,
        event_date: form.event_date,
        award: form.award.trim(),
        description: form.description.trim() || null,
        images,
      };

      const res = await fetch(
        editingId ? `/api/achievements/${editingId}` : "/api/achievements",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");

      /* 3. Success */
      const wasEditing = editingId !== null;
      const savedTitle = form.title;
      setStatus("success");
      setStatusMsg(
        wasEditing
          ? `"${savedTitle}" updated!`
          : `"${savedTitle}" saved! It will appear on the homepage.`
      );
      resetForm();
      await refreshList();
    } catch (err: unknown) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isEditing = editingId !== null;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-cream font-lato">
      {/* Header */}
      <header className="bg-parchment border-b border-mint/60 px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="text-sage hover:text-sage-dark transition-colors text-sm font-semibold"
        >
          ← Back to Homepage
        </Link>
        <span className="text-brown/20 select-none">|</span>
        <h1 className="font-dancing text-2xl text-brown flex-1">Admin Dashboard ✦</h1>
        <button
          onClick={handleLogout}
          className="font-lato text-xs text-brown/60 hover:text-red-600 transition-colors border border-brown/20 hover:border-red-300 px-3 py-1.5 rounded-full"
        >
          Log out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Status banner */}
        {status !== "idle" && statusMsg && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm font-lato ${
              status === "success"
                ? "bg-mint-light text-sage-dark border border-mint"
                : status === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-beige text-brown border border-parchment animate-pulse"
            }`}
          >
            {statusMsg}
          </div>
        )}

        {/* OCR Section */}
        <section className="mb-10 p-6 bg-white rounded-xl border border-parchment shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">📄</span>
            <div>
              <h2 className="font-playfair text-lg font-semibold text-brown">
                Auto-fill from Certificate
              </h2>
              <p className="text-xs text-brown/60 mt-0.5">
                Upload a certificate image — Tesseract OCR will pre-fill the
                form
              </p>
            </div>
          </div>

          <label
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 cursor-pointer transition-colors ${
              status === "ocr"
                ? "border-sage bg-mint-light/30 cursor-wait"
                : "border-mint hover:border-sage hover:bg-mint-light/20"
            }`}
          >
            <span className="text-3xl">🏅</span>
            <span className="text-sm text-brown/70">
              {status === "ocr"
                ? "Processing…"
                : "Click or drag a certificate image"}
            </span>
            <input
              ref={ocrInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={status === "ocr" || status === "saving"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleOcrFile(f);
                e.target.value = "";
              }}
            />
          </label>

          {ocrRaw && (
            <details className="mt-3">
              <summary className="text-xs text-brown/50 cursor-pointer hover:text-brown">
                Show raw OCR text
              </summary>
              <pre className="mt-2 text-[10px] text-brown/60 bg-beige rounded p-3 max-h-32 overflow-auto whitespace-pre-wrap">
                {ocrRaw}
              </pre>
            </details>
          )}
        </section>

        {/* Achievement Form */}
        <div ref={formRef} className="scroll-mt-6">
          {isEditing && (
            <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-mint-light border border-mint">
              <span className="text-sm text-sage-dark font-semibold">
                ✏️ Editing existing achievement
              </span>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-brown/60 hover:text-brown underline underline-offset-2"
              >
                Cancel
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="font-playfair text-xl font-bold text-brown border-b border-parchment pb-3">
              {isEditing ? "Edit Achievement" : "Achievement Details"}
            </h2>

            {/* Tournament Name */}
            <Field label="Tournament Name" required>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Thailand Junior Open 2024"
                required
                className="input-base"
              />
            </Field>

            {/* Age Group */}
            <Field label="Age Group" required>
              <select
                name="age_group"
                value={form.age_group}
                onChange={handleChange}
                required
                className="input-base bg-white"
              >
                <option value="">Select age group…</option>
                <option value="8-10">8–10 years</option>
                <option value="12-14">12–14 years</option>
                <option value="16-18">16–18 years</option>
              </select>
            </Field>

            {/* Division / Category */}
            <Field label="Division / Category" hint="optional">
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Singles U14"
                className="input-base"
              />
            </Field>

            {/* Event Date */}
            <Field label="Event Date" required>
              <input
                name="event_date"
                type="date"
                value={form.event_date}
                onChange={handleChange}
                required
                className="input-base"
              />
            </Field>

            {/* Award */}
            <Field label="Award / Result" required>
              <div className="relative">
                <input
                  name="award"
                  value={form.award}
                  onChange={handleChange}
                  placeholder='e.g. "1st Place" or "Runner-up"'
                  required
                  className="input-base pr-24"
                />
                {form.award && (
                  <span
                    className={`award-badge ${badgeClass(form.award)} absolute right-3 top-1/2 -translate-y-1/2`}
                  >
                    {badgeClass(form.award) === "badge-gold"
                      ? "🥇"
                      : badgeClass(form.award) === "badge-silver"
                        ? "🥈"
                        : "🎾"}{" "}
                    Preview
                  </span>
                )}
              </div>
            </Field>

            {/* Notes */}
            <Field label="Notes" hint="optional">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Any extra context about this achievement…"
                rows={3}
                className="input-base resize-none"
              />
            </Field>

            {/* Photo Upload */}
            <Field label="Photos" hint="optional — drag-and-drop or click">
              {/* Already-saved images (edit mode) */}
              {existingImages.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-brown/50 mb-2">Current photos</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((url) => (
                      <div key={url} className="relative w-20 h-20 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Saved photo"
                          className="w-full h-full object-cover rounded-lg border border-parchment"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          aria-label="Remove saved photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => photoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 cursor-pointer transition-colors text-center ${
                  isDraggingOver
                    ? "border-sage bg-mint-light/40"
                    : "border-mint hover:border-sage hover:bg-mint-light/20"
                }`}
              >
                <span className="text-2xl block mb-1">📸</span>
                <span className="text-sm text-brown/60">
                  {isEditing
                    ? "Add more photos — drop here or click"
                    : "Drop photos here or click to browse"}
                </span>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addPhotos(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </div>

              {/* New (unsaved) thumbnails */}
              {photoUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {photoUrls.map((url, i) => (
                    <div key={url} className="relative w-20 h-20 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-parchment"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Submit */}
            <div className="flex gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={status === "saving"}
                  className="px-5 bg-white text-brown/70 font-lato font-semibold py-3 rounded-full text-base border border-parchment hover:border-brown/30 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={status === "saving" || status === "ocr"}
                className="flex-1 bg-sage text-cream font-lato font-semibold py-3 rounded-full text-base hover:bg-sage-dark transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
              >
                {status === "saving"
                  ? "Saving…"
                  : isEditing
                    ? "Update Achievement ✦"
                    : "Save Achievement ✦"}
              </button>
            </div>
          </form>
        </div>

        {/* Manage existing achievements */}
        <section className="mt-14">
          <h2 className="font-playfair text-xl font-bold text-brown border-b border-parchment pb-3 mb-5">
            Manage Achievements{" "}
            <span className="text-brown/40 text-sm font-normal">
              ({list.length})
            </span>
          </h2>

          {list.length === 0 ? (
            <p className="text-sm text-brown/50">
              No achievements yet — add your first one above.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center gap-4 bg-white rounded-xl p-3 border transition-colors ${
                    editingId === a.id
                      ? "border-sage ring-1 ring-sage/30"
                      : "border-parchment"
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg bg-mint-light overflow-hidden shrink-0 flex items-center justify-center">
                    {a.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.images[0]}
                        alt={a.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🎾</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-playfair text-sm font-semibold text-brown truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-brown/60 mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`award-badge ${badgeClass(a.award)}`}>
                        {a.award}
                      </span>
                      <span>
                        {a.age_group} · {formatDate(a.event_date)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(a)}
                      className="text-xs font-semibold text-sage hover:text-sage-dark border border-sage/40 hover:border-sage px-3 py-1.5 rounded-full transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a)}
                      disabled={deletingId === a.id}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                    >
                      {deletingId === a.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Inline styles for input fields (Tailwind v4 inline utility) */}
      <style>{`
        .input-base {
          width: 100%;
          padding: 0.6rem 0.875rem;
          border: 1.5px solid #ede8d0;
          border-radius: 0.5rem;
          background: #fff;
          font-family: var(--font-lato), Helvetica, sans-serif;
          font-size: 0.9rem;
          color: #2c2c2c;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-base:focus {
          border-color: #4a7c4a;
          box-shadow: 0 0 0 3px rgba(74, 124, 74, 0.12);
        }
        .input-base::placeholder {
          color: #8b7355;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block font-lato text-sm font-semibold text-brown">
        {label}
        {required && <span className="text-sage ml-1">*</span>}
        {hint && (
          <span className="font-normal text-brown/50 ml-1.5">({hint})</span>
        )}
      </label>
      {children}
    </div>
  );
}
