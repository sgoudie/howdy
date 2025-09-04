import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getSupabaseActionClient } from "@/lib/supabaseServer";
import { subscribeWithAccount } from "@/features/subscribers/lib/subscribeWithAccount";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Use POST /api/subscribers with { email }" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const phone = typeof body?.phone === "string" ? body.phone : undefined;
    if (!email) {
      return NextResponse.json({ ok: false, status: 400, error: "Email is required." }, { status: 400 });
    }

    // First try cookies-based auth
    const server = await getSupabaseActionClient();
    const { data: cookieUser } = await server.auth.getUser();

    let userId = cookieUser.user?.id as string | undefined;
    let dbClient = server;

    // Fallback to Authorization header Bearer token (for non-browser callers)
    if (!userId) {
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
      const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : undefined;
      if (token) {
        const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const dbFromToken = createClient(supaUrl, supaAnon, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData } = await dbFromToken.auth.getUser();
        userId = userData.user?.id || undefined;
        dbClient = dbFromToken;
      }
    }

    if (!userId) {
      console.error("/api/subscribers: not authenticated (no cookie user or bearer token)");
      return NextResponse.json({ ok: false, status: 401, error: "Not authenticated." }, { status: 401 });
    }

    const result = await subscribeWithAccount({ email, phone, db: dbClient, userId });

    if (!result.ok) {
      console.error("/api/subscribers: subscribeWithAccount failed", result);
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
    console.error("/api/subscribers: unexpected error", error);
    return NextResponse.json(
      { ok: false, status: 500, error: message },
      { status: 500 }
    );
  }
}


