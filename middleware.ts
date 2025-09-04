import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });
  // Forward original URL and pathname for server components to read
  res.headers.set("x-app-url", req.nextUrl.origin);
  res.headers.set("x-app-pathname", req.nextUrl.pathname);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: { name?: string; value?: string; [key: string]: unknown } = {}) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: { name?: string; value?: string; [key: string]: unknown } = {}) {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Touch auth to refresh session/cookies if needed
  await supabase.auth.getSession();
  return res;
}

export const config = {
  matcher: ["/(.*)"],
};


