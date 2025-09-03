"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; email: string }
  | { status: "unauthenticated" };

export default function HeaderAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email || null;
      if (!mounted) return;
      if (email) setAuth({ status: "authenticated", email });
      else setAuth({ status: "unauthenticated" });
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || null;
      if (email) setAuth({ status: "authenticated", email });
      else setAuth({ status: "unauthenticated" });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex items-center gap-3">
      {auth.status === "authenticated" ? (
        <>
          <span className="text-sm text-gray-600 hidden sm:inline">{auth.email}</span>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Account Settings
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Logout
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {auth.status === "loading" ? "Loading..." : "Login"}
        </Link>
      )}
    </div>
  );
}


