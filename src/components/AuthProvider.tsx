"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getHistory } from "@/lib/storage";
import { mergeLocalIntoCloud } from "@/lib/cloudStorage";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import AuthModal from "./AuthModal";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  openAuthModal: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>.");
  }
  return ctx;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        if (event === "SIGNED_IN") {
          setModalOpen(false);
          // One-time push of this device's guest history into the
          // account. upsertCloudRabbitHole keys on the entry's own id, so
          // this is safe to run every sign-in - nothing duplicates.
          const local = getHistory();
          if (local.length > 0) {
            mergeLocalIntoCloud(local).catch(() => {
              // Best-effort - the local copy is untouched either way.
            });
          }
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        openAuthModal: () => setModalOpen(true),
        signOut,
      }}
    >
      {children}
      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </AuthContext.Provider>
  );
}
