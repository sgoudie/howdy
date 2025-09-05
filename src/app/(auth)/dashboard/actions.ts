"use server";

import { getSupabaseActionClient } from "@/lib/supabaseServer";
import { testConvertKitApiKey } from "@/features/subscribers/lib/convertkit";

export type ConnectionStatus =
  | { provider: "convertkit"; status: "missing"; checkedAt: string }
  | { provider: "convertkit"; status: "ok"; checkedAt: string }
  | { provider: "convertkit"; status: "error"; error: string; checkedAt: string };

export async function checkConvertKitConnection(): Promise<ConnectionStatus> {
  const supabase = await getSupabaseActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { provider: "convertkit", status: "error", error: "Not authenticated", checkedAt: new Date().toISOString() };

  const { data: acc, error } = await supabase
    .from("accounts")
    .select("convertkit_api_key")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) return { provider: "convertkit", status: "error", error: error.message || "Failed to load account", checkedAt: new Date().toISOString() };

  const apiKey = (acc?.convertkit_api_key || "").trim();
  if (!apiKey) return { provider: "convertkit", status: "missing", checkedAt: new Date().toISOString() };

  const result = await testConvertKitApiKey(apiKey);
  if (result.ok) return { provider: "convertkit", status: "ok", checkedAt: new Date().toISOString() };
  return {
    provider: "convertkit",
    status: "error",
    error: result.error,
    checkedAt: new Date().toISOString(),
  };
}


