"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { debugLog } from "@/lib/debug";
import { ensureAccountForUser, type Account } from "@/lib/ensureAccountForUser";

type AccountContextValue = {
  account: Account | null;
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  refresh: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<AccountContextValue["status"]>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  const load = async () => {
    setStatus("loading");
    setError(undefined);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id || null;
      if (!userId) {
        setAccount(null);
        setStatus("ready");
        return;
      }
      const acc = await ensureAccountForUser(userId);
      debugLog("Account loaded", acc);
      setAccount(acc);
      setStatus("ready");
    } catch (err) {
      debugLog("Account load error", err);
      setError(err instanceof Error ? err.message : "Failed to load account");
      setStatus("error");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await load();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog("Auth change", event, session?.user?.id);
      if (!session?.user?.id) {
        setAccount(null);
        setStatus("ready");
        return;
      }

      // Avoid reloading account on frequent low-signal events; but do refresh once after user update to keep consistency
      if (event === "TOKEN_REFRESHED") return;

      try {
        const acc = await ensureAccountForUser(session.user.id);
        setAccount(acc);
        // Keep status as ready (no transient loading UI during auth churn)
        setStatus("ready");
      } catch (err) {
        debugLog("Account load on auth change error", err);
        setError(err instanceof Error ? err.message : "Failed to load account");
        setStatus("error");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      account,
      status,
      error,
      refresh: load,
    }),
    [account, status, error],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
