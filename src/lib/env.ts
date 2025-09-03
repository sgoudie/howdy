export type ServerEnv = Record<string, never>;

export function getServerEnv(): ServerEnv {
  return {} as const;
}


