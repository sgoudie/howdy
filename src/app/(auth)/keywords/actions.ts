"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseActionClient } from "@/lib/supabaseServer";

export type AddKeywordResult =
  | { ok: true }
  | { ok: false; message: string };

export async function addKeywordAction(_prev: AddKeywordResult | null, formData: FormData): Promise<AddKeywordResult> {
  const label = String(formData.get("label") || "").trim();
  if (!label) return { ok: false, message: "Please enter a label." };
  if (/\s/.test(label)) {
    return { ok: false, message: "Labels cannot contain spaces." };
  }

  const supabase = await getSupabaseActionClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return { ok: false, message: userErr?.message || "Not authenticated." };
  }

  const userId = userRes.user.id;

  // Get the account for the user
  const { data: account, error: accountErr } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (accountErr || !account) {
    return { ok: false, message: accountErr?.message || "Account not found." };
  }

  const upper = label.toUpperCase();

  const { error: insertErr } = await supabase
    .from("keywords")
    .insert({ label: upper, account_id: account.id });

  if (insertErr) {
    const code = (insertErr as any)?.code as string | undefined;
    const raw = insertErr.message || "";
    const isUnique = code === "23505" || /unique|duplicate/i.test(raw);
    const friendly = isUnique ? "Keyword already exists. Keywords must be unique." : (raw || "Failed to add keyword.");
    return { ok: false, message: friendly };
  }

  // Refresh the keywords page
  revalidatePath("/keywords");
  return { ok: true };
}

export type DeleteKeywordResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteKeywordAction(_prev: DeleteKeywordResult | null, formData: FormData): Promise<DeleteKeywordResult> {
  const id = String(formData.get("id") || "").trim();
  if (!id) return { ok: false, message: "Missing keyword id." };

  const supabase = await getSupabaseActionClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return { ok: false, message: userErr?.message || "Not authenticated." };
  }
  const userId = userRes.user.id;

  const { data: account, error: accountErr } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (accountErr || !account) {
    return { ok: false, message: accountErr?.message || "Account not found." };
  }

  const { data: deleted, error: delErr } = await supabase
    .from("keywords")
    .delete()
    .eq("id", id)
    .eq("account_id", account.id)
    .select("id")
    .maybeSingle();

  if (delErr) {
    return { ok: false, message: delErr.message || "Failed to delete keyword." };
  }
  if (!deleted) {
    return { ok: false, message: "Keyword not found." };
  }

  revalidatePath("/keywords");
  return { ok: true };
}


