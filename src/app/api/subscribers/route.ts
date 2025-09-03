import { NextResponse } from "next/server";
import { subscribeEmailToTag } from "@/features/subscribers/lib/convertkit";
import { supabase } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Use POST /api/subscribers with { email }" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const tag = typeof body?.tag === "string" ? body.tag : undefined;

    // Extract access token from Authorization header to identify the user
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : undefined;

    const { data: userData } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } as { user: { id: string } | null } };
    const userId = userData?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { ok: false, status: 401, error: "Not authenticated." },
        { status: 401 }
      );
    }

    // Load account for user to get ConvertKit API key and default tag label
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    // Create a per-request client that forwards the user's JWT for RLS
    const db = createClient(supaUrl, supaAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: accRows, error: accErr } = await db
      .from("accounts")
      .select("convertkit_api_key, convertkit_howdy_tag_label")
      .eq("user_id", userId)
      .limit(1);
    if (accErr) {
      return NextResponse.json(
        { ok: false, status: 500, error: accErr.message || "Failed to load account." },
        { status: 500 }
      );
    }
    const account = accRows && accRows[0];
    const apiKey = account?.convertkit_api_key as string | undefined;
    const defaultTag = (account?.convertkit_howdy_tag_label as string | undefined) || "source-howdy";
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, status: 400, error: "Missing ConvertKit API Key. Add it in Settings → Mailing List." },
        { status: 400 }
      );
    }

    const result = await subscribeEmailToTag(email, tag || defaultTag, apiKey);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: result.status || 500,
          error: result.error,
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({ ok: true, status: result.status }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { ok: false, status: 500, error: message },
      { status: 500 }
    );
  }
}


