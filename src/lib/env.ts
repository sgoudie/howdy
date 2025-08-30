export type ServerEnv = {
  convertkitApiKey: string;
  convertkitApiSecret?: string;
};

export function getServerEnv(): ServerEnv {
  const apiKey = process.env.CONVERTKIT_API_KEY;
  const apiSecret = process.env.CONVERTKIT_API_SECRET;

  if (!apiKey) {
    throw new Error("Missing CONVERTKIT_API_KEY environment variable");
  }

  return {
    convertkitApiKey: apiKey,
    convertkitApiSecret: apiSecret || undefined,
  };
}


