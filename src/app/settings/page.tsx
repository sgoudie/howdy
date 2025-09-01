"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AccountSettingsForm from "@/components/AccountSettingsForm";

type GateState = "loading" | "allowed" | "redirect";

export default function SettingsPage() {
  const router = useRouter();
  const [gate, setGate] = useState<GateState>("loading");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email || null;
      if (!mounted) return;
      if (email) setGate("allowed");
      else {
        setGate("redirect");
        router.replace("/login");
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || null;
      if (email) setGate("allowed");
      else {
        setGate("redirect");
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (gate !== "allowed") return null;

  return <AccountSettingsForm />;
}


