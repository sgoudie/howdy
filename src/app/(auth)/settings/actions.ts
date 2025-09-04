"use server";

import { getSupabaseActionClient } from "@/lib/supabaseServer";

export type SaveSettingsResult = { ok: true; message: string } | { ok: false; message: string };

export async function saveSettingsAction(
  _prevState: SaveSettingsResult | null,
  formData: FormData,
): Promise<SaveSettingsResult> {
  const supabase = await getSupabaseActionClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, message: userErr?.message || "Not authenticated." };
  }

  const { error: updErr } = await supabase.auth.updateUser({
    data: {
      first_name: String(formData.get("firstName") || ""),
      last_name: String(formData.get("lastName") || ""),
    },
  });
  if (updErr) {
    return { ok: false, message: updErr.message || "Failed to update profile." };
  }

  const { error: accErr } = await supabase
    .from("accounts")
    .update({
      name: String(formData.get("accountName") || ""),
      convertkit_api_key: String(formData.get("convertkitApiKey") || ""),
      convertkit_howdy_tag_label: String(formData.get("convertkitTag") || "source-howdy"),
    })
    .eq("user_id", user.id);

  if (accErr) {
    return { ok: false, message: accErr.message || "Failed to update account." };
  }

  return { ok: true, message: "Settings saved." };
}
