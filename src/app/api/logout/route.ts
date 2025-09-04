import { NextResponse } from "next/server";
import { getSupabaseActionClient } from "@/lib/supabaseServer";

export async function POST() {
  try {
    const supabase = await getSupabaseActionClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to logout";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
