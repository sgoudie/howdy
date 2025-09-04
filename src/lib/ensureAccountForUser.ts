import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Account = {
  id: string;
  user_id: string;
  name: string | null;
  convertkit_api_key: string | null;
  convertkit_howdy_tag_label: string | null;
};

/**
 * Ensure there is an account row for the given user.
 * - Returns existing account if present
 * - Otherwise creates a new default account for the user
 */
export async function ensureAccountForUser(
  userId: string,
  client?: SupabaseClient,
): Promise<Account> {
  const db = client || supabase;
  // Try to find an existing account
  const { data: found, error: findError } = await db
    .from("accounts")
    .select("id,user_id,name,convertkit_api_key,convertkit_howdy_tag_label")
    .eq("user_id", userId)
    .limit(1);

  if (findError) {
    // Surface select errors to the caller
    throw findError;
  }

  if (found && found.length > 0) {
    return found[0] as Account;
  }

  // No account found — create a default one
  const { data: created, error: insertError } = await db
    .from("accounts")
    .insert({
      user_id: userId,
      name: "New Account",
      convertkit_howdy_tag_label: "source-howdy",
    })
    .select("id,user_id,name,convertkit_api_key,convertkit_howdy_tag_label")
    .single();

  if (insertError) {
    throw insertError;
  }

  if (!created) {
    throw new Error("Failed to create account for user");
  }

  return created as Account;
}
