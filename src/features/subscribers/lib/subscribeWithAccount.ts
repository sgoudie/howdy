import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { subscribeEmailToTag } from "./convertkit";

export type SubscribeInput = {
  email: string;
  phone?: string | null;
  userJwt?: string; // Optional: Supabase JWT for RLS
  db?: SupabaseClient; // Optional: preconfigured client (e.g., from server actions/route)
  userId?: string; // Optional override when known
};

export type SubscribeOutcome =
  | { ok: true; status: number }
  | { ok: false; status: number; error: string };

export async function subscribeWithAccount({ email, phone, userJwt, db, userId: providedUserId }: SubscribeInput): Promise<SubscribeOutcome> {
  try {
    let dbClient: SupabaseClient;
    if (db) {
      dbClient = db;
    } else if (userJwt) {
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      dbClient = createClient(supaUrl, supaAnon, {
        global: { headers: { Authorization: `Bearer ${userJwt}` } },
      });
    } else {
      console.error("subscribeWithAccount: neither db nor userJwt provided");
      return { ok: false, status: 500, error: "Server misconfiguration." };
    }

    // Identify user to scope account lookup
    const { data: userRes } = await dbClient.auth.getUser();
    const userId = providedUserId || userRes.user?.id;
    if (!userId) {
      console.error("subscribeWithAccount: No user id resolved from JWT");
      return { ok: false, status: 401, error: "Not authenticated." };
    }

    const { data: acc, error: accErr } = await dbClient
      .from("accounts")
      .select("convertkit_api_key, convertkit_howdy_tag_label")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (accErr) {
      console.error("subscribeWithAccount: account lookup error", accErr);
      return { ok: false, status: 500, error: accErr.message || "Failed to load account." };
    }

    const apiKey = (acc?.convertkit_api_key as string | undefined) || "";
    const tagName = (acc?.convertkit_howdy_tag_label as string | undefined) || "source-howdy";
    if (!apiKey) {
      console.error("subscribeWithAccount: missing ConvertKit API key for user", { userId });
      return { ok: false, status: 400, error: "Missing ConvertKit API Key. Add it in Settings." };
    }

    // Note: phone reserved for future use with Kit if supported
    const result = await subscribeEmailToTag(email, tagName, apiKey, phone || undefined);
    if (!result.ok) {
      console.error("subscribeWithAccount: ConvertKit subscribe failed", { status: result.status, error: result.error, email, tagName });
      return { ok: false, status: result.status, error: result.error };
    }

    return { ok: true, status: result.status };
  } catch (e) {
    const m = e instanceof Error ? e.message : "Server error";
    console.error("subscribeWithAccount: unexpected error", e);
    return { ok: false, status: 500, error: m };
  }
}


