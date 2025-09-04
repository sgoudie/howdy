export type ServerEnv = Readonly<Record<string, never>>;

export function getServerEnv(): ServerEnv {
  return {} as const;
}


