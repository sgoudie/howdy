import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/settings";

  const redirectUrl = new URL(next, requestUrl.origin);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(
          name: string,
          value: string,
          options: { name?: string; value?: string; [key: string]: unknown } = {},
        ) {
          response.cookies.set({ name, value, ...(options as Record<string, unknown>) });
        },
        remove(
          name: string,
          options: { name?: string; value?: string; [key: string]: unknown } = {},
        ) {
          response.cookies.set({ name, value: "", ...(options as Record<string, unknown>) });
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
