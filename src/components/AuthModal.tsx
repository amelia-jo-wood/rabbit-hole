"use client";

import { FormEvent, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

interface Props {
  onClose: () => void;
}

type Mode = "sign-in" | "sign-up";

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage("Almost there — check your email for a confirmation link.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        // AuthProvider's onAuthStateChange listener closes this modal once
        // the session actually comes through.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
    // On success the browser navigates away to Google, then back - nothing
    // else to do here.
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">
            {mode === "sign-in" ? "Log in" : "Create an account"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink/40 hover:text-ink"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          Save your rabbit holes and pick up where you left off on any device.
        </p>

        {!isSupabaseConfigured ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">
            Accounts aren&apos;t set up on this deployment yet (missing
            Supabase configuration).
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              className="mt-4 w-full rounded-full border border-line py-3 text-sm font-semibold text-ink hover:bg-black/5"
            >
              Continue with Google
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              {message && (
                <p className="text-xs text-emerald-600">{message}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-coral py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Working…" : mode === "sign-in" ? "Log in" : "Sign up"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                setError(null);
                setMessage(null);
              }}
              className="mt-4 w-full text-center text-xs font-semibold text-coral"
            >
              {mode === "sign-in"
                ? "Need an account? Sign up"
                : "Already have an account? Log in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
