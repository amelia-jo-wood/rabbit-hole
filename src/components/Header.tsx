"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useAuth } from "./AuthProvider";

interface Props {
  onBack?: () => void;
}

export default function Header({ onBack }: Props) {
  const { user, loading, openAuthModal, signOut } = useAuth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="text-lg text-ink/70 hover:text-ink"
          >
            ←
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            aria-label="History"
            className="text-sm font-medium text-ink/60 hover:text-ink"
          >
            History
          </Link>
          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={signOut}
                title={user.email ?? undefined}
                className="text-sm font-medium text-ink/60 hover:text-ink"
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="text-sm font-medium text-coral hover:opacity-80"
              >
                Log in
              </button>
            ))}
        </div>
      </div>
    </header>
  );
}
