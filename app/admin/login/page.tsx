"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error ?? "Incorrect password.");
        setPassword("");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen notebook-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Polaroid-style card */}
        <div className="polaroid polaroid-tilt-n relative mx-auto">
          {/* Washi tape */}
          <div className="tape" />

          {/* Header */}
          <div className="text-center mb-6 mt-2">
            <p className="font-dancing text-3xl text-sage-dark leading-none">
              Phassaree ✦
            </p>
            <p className="font-lato text-xs text-brown/50 tracking-widest uppercase mt-1">
              Admin Access
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-lato text-xs font-semibold text-brown mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoFocus
                disabled={loading}
                className="w-full px-3.5 py-2.5 border-2 border-parchment rounded-lg font-lato text-sm text-brown bg-cream focus:outline-none focus:border-sage transition-colors placeholder:text-brown/30 disabled:opacity-60"
              />
            </div>

            {error && (
              <p className="font-lato text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-sage text-cream font-lato font-semibold py-2.5 rounded-full hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide shadow-sm"
            >
              {loading ? "Verifying…" : "Enter the Archive ✦"}
            </button>
          </form>

          {/* Decorative tennis emoji */}
          <p className="text-center text-2xl mt-5 opacity-30 select-none">
            🎾
          </p>
        </div>

        <p className="text-center font-dancing text-brown/40 text-sm mt-6">
          Phassaree&apos;s Tennis Archive
        </p>
      </div>
    </div>
  );
}
