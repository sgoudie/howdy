export function getAppUrl(): string {
  // Client: prefer explicit env, else the current origin
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }

  // Server: prefer public env (inlined at build), then Vercel-provided URL, then APP_URL, then localhost
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (publicUrl) return publicUrl;

  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  if (vercelUrl) return vercelUrl;

  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl;

  return "http://localhost:3000";
}


