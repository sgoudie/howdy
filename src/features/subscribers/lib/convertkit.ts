import { getServerEnv } from "@/lib/env";

export type SubscribeResult =
  | { ok: true; status: number; data?: unknown }
  | { ok: false; status: number; error: string };

export type TagInfoResult =
  | { ok: true; status: number; id: string; name: string }
  | { ok: false; status: number; error: string };

// Removed legacy getTagInfo tied to CONVERTKIT_TAG_ID

type KitErrorJson = {
  errors?: string[];
  message?: string;
};

type KitTag = {
  id: number | string;
  name?: string;
};

type ListTagsJson = KitErrorJson & {
  tags?: KitTag[];
};

type CreateTagJson = KitErrorJson & {
  tag?: KitTag;
};

type CreateSubscriberJson = KitErrorJson & {
  subscriber?: { id: number | string };
};

type LookupSubscribersJson = KitErrorJson & {
  subscribers?: Array<{ id: number | string }>;
};

export async function ensureTagByName(tagName: string): Promise<TagInfoResult> {
  const name = (tagName || "").trim();
  if (!name) {
    return { ok: false, status: 400, error: "Tag name is required" };
  }

  let env;
  try {
    env = getServerEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server configuration error";
    return { ok: false, status: 500, error: message };
  }

  try {
    // 1) list tags and match by name (case-insensitive)
    const listRes = await fetch("https://api.kit.com/v4/tags", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": env.convertkitApiKey,
      },
    });
    const listJson = (await listRes.json().catch(() => ({}))) as ListTagsJson;
    if (listRes.ok && Array.isArray(listJson.tags)) {
      const found = listJson.tags.find((t) => String(t?.name ?? "").toLowerCase() === name.toLowerCase());
      if (found?.id) {
        return { ok: true, status: 200, id: String(found.id), name: String(found.name ?? name) };
      }
    }

    // 2) create if not found
    const createRes = await fetch("https://api.kit.com/v4/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": env.convertkitApiKey,
      },
      body: JSON.stringify({ name }),
    });
    const createJson = (await createRes.json().catch(() => ({}))) as CreateTagJson;
    if (!createRes.ok) {
      const msg = Array.isArray(createJson.errors) && createJson.errors[0]
        ? createJson.errors[0]
        : createJson.message || "Failed to create tag";
      return { ok: false, status: createRes.status || 500, error: msg };
    }
    const created = createJson.tag;
    if (created?.id) {
      return { ok: true, status: 201, id: String(created.id), name: String(created.name ?? name) };
    }
    return { ok: false, status: 500, error: "Unexpected create tag response" };
  } catch (e) {
    const m = e instanceof Error ? e.message : "Network error";
    return { ok: false, status: 500, error: m };
  }
}

export async function subscribeEmailToTag(email: string, tagName?: string): Promise<SubscribeResult> {
  const trimmedEmail = (email || "").trim();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { ok: false, status: 400, error: "A valid email is required." };
  }

  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server configuration error";
    return { ok: false, status: 500, error: message };
  }

  // Determine tag to use: name provided or default 'source-howdy'
  const desiredTagName = (tagName && tagName.trim()) || "source-howdy";
  const ensured = await ensureTagByName(desiredTagName);
  if (!ensured.ok) {
    return { ok: false, status: ensured.status, error: ensured.error };
  }
  const tagIdToUse = ensured.id;

  async function createSubscriberAndGetId(): Promise<
    { ok: true; id: string } | { ok: false; status: number; error: string }
  > {
    try {
      const res = await fetch("https://api.kit.com/v4/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": env.convertkitApiKey,
        },
        body: JSON.stringify({ email_address: trimmedEmail }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const body = (isJson ? await res.json() : await res.text()) as CreateSubscriberJson | string;

      const existingId =
        typeof body === "object" && body && body.subscriber?.id !== undefined
          ? String(body.subscriber.id)
          : undefined;
      if (res.ok && existingId) {
        return { ok: true, id: existingId };
      }

      // If already exists or validation error, try lookup by email
      if (res.status === 409 || res.status === 422 || res.status === 400) {
        const lookup = await fetch(
          `https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(trimmedEmail)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Kit-Api-Key": env.convertkitApiKey,
            },
          }
        );
        const lookupJson = (await lookup.json().catch(() => ({}))) as LookupSubscribersJson;
        if (
          lookup.ok &&
          Array.isArray(lookupJson.subscribers) &&
          lookupJson.subscribers[0]?.id
        ) {
          return { ok: true, id: String(lookupJson.subscribers[0].id) };
        }
      }

      const msg =
        typeof body === "object"
          ? (Array.isArray(body.errors) && body.errors[0]) || body.message || "Failed to create subscriber"
          : body || "Failed to create subscriber";
      return { ok: false, status: res.status || 500, error: String(msg) };
    } catch (e) {
      const m = e instanceof Error ? e.message : "Network error";
      return { ok: false, status: 500, error: m };
    }
  }

  async function tagSubscriberId(subscriberId: string): Promise<SubscribeResult> {
    try {
      const tagUrl = `https://api.kit.com/v4/tags/${encodeURIComponent(tagIdToUse)}/subscribers/${encodeURIComponent(
        subscriberId
      )}`;
      const res = await fetch(tagUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": env.convertkitApiKey,
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as KitErrorJson | Record<string, never>;
        const msg = Array.isArray((body as KitErrorJson).errors) && (body as KitErrorJson).errors![0]
          ? (body as KitErrorJson).errors![0]
          : (body as KitErrorJson).message || "Failed to tag subscriber";
        return { ok: false, status: res.status, error: String(msg) };
      }
      return { ok: true, status: res.status, data: undefined };
    } catch (e) {
      const m = e instanceof Error ? e.message : "Network error";
      return { ok: false, status: 500, error: m };
    }
  }

  const created = await createSubscriberAndGetId();
  if (!created.ok) {
    return { ok: false, status: created.status, error: created.error };
  }
  return await tagSubscriberId(created.id);
}


