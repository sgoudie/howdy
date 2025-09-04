export type ServerEnv = {
  APP_URL: string;
};

export function getServerEnv(): ServerEnv {
  const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { APP_URL } as const;
}


