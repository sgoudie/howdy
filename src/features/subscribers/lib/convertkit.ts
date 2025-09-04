// Uses per-account ConvertKit API key provided by caller

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

export async function ensureTagByName(tagName: string, apiKey: string): Promise<TagInfoResult> {
  const name = (tagName || "").trim();
  if (!name) {
    return { ok: false, status: 400, error: "Tag name is required" };
  }

  try {
    // 1) list tags and match by name (case-insensitive)
    const listRes = await fetch("https://api.kit.com/v4/tags", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
    });
    try {
      const dbg = await listRes.clone().json().catch(() => ({} as { tags?: unknown[] }));
      const tagsCount = Array.isArray(dbg.tags) ? dbg.tags.length : undefined;
      console.log("Kit:list tags status", listRes.status, { tagsCount });
    } catch {}
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
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({ name }),
    });
    try {
      const dbg = await createRes.clone().json().catch(() => ({} as Record<string, unknown>));
      console.log("Kit:create tag status", createRes.status, { body: JSON.stringify(dbg) });
    } catch {}
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

// --- Custom Fields helpers (Kit v4) ---
type CustomField = { id: number | string; name?: string; label?: string; key?: string };
type ListFieldsJson = KitErrorJson & { custom_fields?: CustomField[] };
type CreateFieldJson = KitErrorJson & { custom_field?: CustomField };

function slugifyFieldKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function ensureCustomFieldByName(fieldName: string, apiKey: string): Promise<{ ok: true; id: string; name: string; key?: string } | { ok: false; status: number; error: string }> {
  const name = (fieldName || "").trim();
  if (!name) {
    return { ok: false, status: 400, error: "Field name is required" } as const;
  }
  try {
    // 1) list (use underscored endpoint which is returning 200 in logs)
    const listRes = await fetch("https://api.kit.com/v4/custom_fields", {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey },
    });
    try {
      const dbg = await listRes.clone().json().catch(() => ({} as { custom_fields?: unknown[] }));
      const count = Array.isArray(dbg.custom_fields) ? dbg.custom_fields.length : undefined;
      console.log("Kit:list custom fields status", listRes.status, { count });
    } catch {}
    const listJson = (await listRes.json().catch(() => ({}))) as ListFieldsJson;
    if (listRes.ok && Array.isArray(listJson.custom_fields)) {
      const found = listJson.custom_fields.find((f) => {
        const n = String(f?.name ?? f?.label ?? "").toLowerCase();
        return n === name.toLowerCase();
      });
      if (found?.id) {
        return { ok: true, id: String(found.id), name: String(found.label ?? found.name ?? name), key: found.key ? String(found.key) : undefined } as const;
      }
    }

    // 2) create — Kit may require an explicit type for new fields
    const createRes = await fetch("https://api.kit.com/v4/custom_fields", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey },
      body: JSON.stringify({ name, label: name, key: slugifyFieldKey(name), field_type: "text" }),
    });
    try {
      const dbg = await createRes.clone().json().catch(() => ({} as Record<string, unknown>));
      console.log("Kit:create custom field status", createRes.status, { body: JSON.stringify(dbg) });
    } catch {}
    const createJson = (await createRes.json().catch(() => ({}))) as CreateFieldJson;
    if (!createRes.ok) {
      const msg = Array.isArray(createJson.errors) && createJson.errors[0]
        ? createJson.errors[0]
        : createJson.message || "Failed to create custom field";
      return { ok: false, status: createRes.status || 500, error: msg } as const;
    }
    const created = createJson.custom_field;
    if (created?.id) {
      return { ok: true, id: String(created.id), name: String(created.label ?? created.name ?? name), key: created.key ? String(created.key) : undefined } as const;
    }
    return { ok: false, status: 500, error: "Unexpected create custom field response" } as const;
  } catch (e) {
    const m = e instanceof Error ? e.message : "Network error";
    return { ok: false, status: 500, error: m } as const;
  }
}

export async function subscribeEmailToTag(email: string, tagName: string | undefined, apiKey: string, phone?: string | null): Promise<SubscribeResult> {
  const trimmedEmail = (email || "").trim();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { ok: false, status: 400, error: "A valid email is required." };
  }

  // Determine tag to use: name provided or default 'source-howdy'
  const desiredTagName = (tagName && tagName.trim()) || "source-howdy";
  const ensured = await ensureTagByName(desiredTagName, apiKey);
  if (!ensured.ok) {
    return { ok: false, status: ensured.status, error: ensured.error };
  }
  const tagIdToUse = ensured.id;

  async function createSubscriberAndGetId(): Promise<
    { ok: true; id: string } | { ok: false; status: number; error: string }
  > {
    try {
      // Ensure the custom field exists before sending it; Kit ignores unknown fields
      let phoneFieldKey: string | undefined = undefined;
      if (phone && phone.trim()) {
        const ensuredField = await ensureCustomFieldByName("Phone", apiKey);
        if (!ensuredField.ok) {
          // non-fatal: proceed with creation and tagging
          console.warn("Kit: ensure custom field failed", ensuredField);
        } else {
          // Kit expects the display label as the key in fields, but some accounts surface an internal name.
          // Prefer label (name) but fall back to the 'key' if present.
          phoneFieldKey = ensuredField.name || ensuredField.key || "Phone";
        }
      }

      const res = await fetch("https://api.kit.com/v4/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": apiKey,
        },
        body: JSON.stringify({
          email_address: trimmedEmail,
          ...(phone && phoneFieldKey ? { fields: { [phoneFieldKey]: phone } } : {}),
        }),
      });
      // If Kit upsert ignores fields on 200 case (existing), ensure via explicit update
      if (res.ok && res.status === 200 && phone && phoneFieldKey) {
        // try update immediately so the field is set deterministically
        const createdOrLookup = await fetch(`https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(trimmedEmail)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey },
        });
        const lookJson = (await createdOrLookup.json().catch(() => ({}))) as LookupSubscribersJson;
        const sid = Array.isArray(lookJson.subscribers) && lookJson.subscribers[0]?.id ? String(lookJson.subscribers[0].id) : undefined;
        if (sid) {
          await fetch(`https://api.kit.com/v4/subscribers/${encodeURIComponent(sid)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey },
            body: JSON.stringify({ fields: { [phoneFieldKey]: phone } }),
          }).catch(() => {});
        }
      }

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
              "X-Kit-Api-Key": apiKey,
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
      try {
        console.log("Kit:create subscriber error body", typeof body === "string" ? body : JSON.stringify(body));
      } catch {
        console.log("Kit:create subscriber error body (non-serializable)");
      }
      return { ok: false, status: res.status || 500, error: String(msg) };
    } catch (e) {
      const m = e instanceof Error ? e.message : "Network error";
      return { ok: false, status: 500, error: m };
    }
  }

  async function maybeUpdatePhone(subscriberId: string): Promise<SubscribeResult | { ok: true; status: number }> {
    if (!phone) return { ok: true, status: 200 };
    try {
      const url = `https://api.kit.com/v4/subscribers/${encodeURIComponent(subscriberId)}`;
      // Ensure field exists for updates too
      const ensuredField = await ensureCustomFieldByName("Phone", apiKey);
      // In practice, Kit writes the custom field value under the account-defined key ("phone" per your logs)
      const fieldKey = ensuredField.ok ? (ensuredField.key || ensuredField.name || "Phone") : "Phone";
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": apiKey,
        },
        body: JSON.stringify({ fields: { [fieldKey]: phone } }),
      });
      console.log("Kit:update fields payload", { fieldKey, phone });
      try {
        const dbg = await res.clone().json().catch(() => ({}));
        console.log("Kit:update subscriber fields status", res.status, { body: JSON.stringify(dbg) });
      } catch {}
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as KitErrorJson | Record<string, never>;
        const msg = Array.isArray((body as KitErrorJson).errors) && (body as KitErrorJson).errors![0]
          ? (body as KitErrorJson).errors![0]
          : (body as KitErrorJson).message || "Failed to update phone";
        return { ok: false, status: res.status, error: String(msg) };
      }
      return { ok: true, status: res.status };
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
          "X-Kit-Api-Key": apiKey,
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
  const upd = await maybeUpdatePhone(created.id);
  if (!(typeof upd === 'object' && 'ok' in upd) || !upd.ok) {
    // Even if phone update fails, proceed to tag but surface the error if tagging also fails
    const tagRes = await tagSubscriberId(created.id);
    if (!tagRes.ok) return tagRes;
    const status = typeof (upd as { status?: number }).status === 'number' ? (upd as { status?: number }).status! : 500;
    const error = typeof (upd as { error?: string }).error === 'string' ? (upd as { error?: string }).error! : "Failed to update phone";
    return { ok: false, status, error };
  }
  return await tagSubscriberId(created.id);
}


