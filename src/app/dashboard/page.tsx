"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AddSubscriberForm from "@/features/subscribers/components/AddSubscriberForm";

type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; email: string };

export default function DashboardPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email || null;
      if (!isMounted) return;
      if (email) {
        setSessionState({ status: "authenticated", email });
      } else {
        setSessionState({ status: "unauthenticated" });
        router.replace("/login");
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      const email = currentSession?.user?.email || null;
      if (email) {
        setSessionState({ status: "authenticated", email });
      } else {
        setSessionState({ status: "unauthenticated" });
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (sessionState.status !== "authenticated") {
    return null;
  }

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mt-8">Welcome {sessionState.email}</h1>
      </div>
      <AddSubscriberForm />
    </div>
  );
}


