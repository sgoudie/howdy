export type PublicEnv = Readonly<{ APP_URL: string }>;

// Exposes only safe, public values intended for client use
export function getPublicEnv(): PublicEnv {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { APP_URL } as const;
}
