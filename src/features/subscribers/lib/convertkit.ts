import { getServerEnv } from "@/lib/env";

export type SubscribeResult =
  | { ok: true; status: number; data?: unknown }
  | { ok: false; status: number; error: string };

export type TagInfoResult =
  | { ok: true; status: number; id: string; name: string }
  | { ok: false; status: number; error: string };

export async function getTagInfo(): Promise<TagInfoResult> {
  let env;
  try {
    env = getServerEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server configuration error";
    return { ok: false, status: 500, error: message };
  }

  try {
    // Per docs: use X-Kit-Api-Key header for v4
    const response = await fetch("https://api.kit.com/v4/tags", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": env.convertkitApiKey,
      },
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg =
        (json && typeof json === "object" && Array.isArray((json as any).errors) && (json as any).errors[0]) ||
        (typeof (json as any)?.message === "string" ? (json as any).message : "Failed to list tags.");
      return { ok: false, status: response.status, error: String(msg) };
    }
    const tags = Array.isArray((json as any)?.tags) ? (json as any).tags : Array.isArray(json) ? (json as any) : [];
    const match = tags.find((t: any) => String(t?.id) === env.convertkitTagId);
    if (!match) {
      return { ok: false, status: 404, error: "Tag not found for CONVERTKIT_TAG_ID" };
    }
    const name = typeof match?.name === "string" ? match.name : String(match?.id);
    return { ok: true, status: 200, id: String(match.id), name };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { ok: false, status: 500, error: message };
  }
}

export async function subscribeEmailToTag(email: string): Promise<SubscribeResult> {
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
      const body = isJson ? await res.json() : await res.text();

      const existingId =
        body && typeof body === "object" && (body as any).subscriber?.id
          ? String((body as any).subscriber.id)
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
        const lookupJson = await lookup.json().catch(() => ({}));
        if (
          lookup.ok &&
          Array.isArray((lookupJson as any)?.subscribers) &&
          (lookupJson as any).subscribers[0]?.id
        ) {
          return { ok: true, id: String((lookupJson as any).subscribers[0].id) };
        }
      }

      const msg =
        (body && typeof body === "object" && Array.isArray((body as any).errors) && (body as any).errors[0]) ||
        (typeof body === "string" ? body : "Failed to create subscriber");
      return { ok: false, status: res.status || 500, error: String(msg) };
    } catch (e) {
      const m = e instanceof Error ? e.message : "Network error";
      return { ok: false, status: 500, error: m };
    }
  }

  async function tagSubscriberId(subscriberId: string): Promise<SubscribeResult> {
    try {
      const tagUrl = `https://api.kit.com/v4/tags/${encodeURIComponent(env.convertkitTagId)}/subscribers/${encodeURIComponent(
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
        const body = await res.json().catch(() => ({}));
        const msg =
          (body && typeof body === "object" && Array.isArray((body as any).errors) && (body as any).errors[0]) ||
          "Failed to tag subscriber";
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


