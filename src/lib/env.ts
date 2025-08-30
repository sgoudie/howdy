export type ServerEnv = {
  convertkitApiKey: string;
  convertkitTagId: string;
  convertkitApiSecret?: string;
};

export function getServerEnv(): ServerEnv {
  const apiKey = process.env.CONVERTKIT_API_KEY;
  const tagId = process.env.CONVERTKIT_TAG_ID;
  const apiSecret = process.env.CONVERTKIT_API_SECRET;

  if (!apiKey) {
    throw new Error("Missing CONVERTKIT_API_KEY environment variable");
  }
  if (!tagId) {
    throw new Error("Missing CONVERTKIT_TAG_ID environment variable");
  }

  const tagIsNumeric = /^\d+$/.test(tagId);
  if (!tagIsNumeric) {
    throw new Error("CONVERTKIT_TAG_ID must be a numeric ID (not a label)");
  }

  return {
    convertkitApiKey: apiKey,
    convertkitTagId: tagId,
    convertkitApiSecret: apiSecret || undefined,
  };
}


