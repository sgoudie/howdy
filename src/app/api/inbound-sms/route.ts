import { NextResponse } from "next/server";

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: message }, { status: 401, headers: { "WWW-Authenticate": "Basic realm=\"howdy-sms\"" } });
}

function getBasicAuth(request: Request): { username: string; password: string } | null {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ", 2);
  if (!scheme || scheme.toLowerCase() !== "basic" || !value) return null;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    return { username: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Verify Basic Auth against env
  const creds = getBasicAuth(request);
  const u = process.env.SMSWORKS_WEBHOOK_USER || "";
  const p = process.env.SMSWORKS_WEBHOOK_PASS || "";
  if (!u || !p) {
    console.warn("/api/inbound-sms: webhook credentials are not set in env");
  }
  if (!creds || creds.username !== u || creds.password !== p) {
    return unauthorized();
  }

  // Read raw body (they may send form-encoded or JSON; capture both)
  let contentType = request.headers.get("content-type") || "";
  contentType = contentType.toLowerCase();
  let rawBody = "";
  let body: unknown = undefined;
  try {
    if (contentType.includes("application/json")) {
      body = await request.json();
      rawBody = JSON.stringify(body);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      const obj = Object.fromEntries(form.entries());
      body = obj;
      rawBody = new URLSearchParams(obj as Record<string, string>).toString();
    } else {
      rawBody = await request.text();
      try { body = JSON.parse(rawBody); } catch { body = rawBody; }
    }
  } catch (error) {
    console.error("/api/inbound-sms: error reading body", error);
  }

  // Log safe shape only (no PII)
  const shape = (() => {
    if (!body || typeof body !== "object") return { type: typeof body };
    const obj = body as Record<string, unknown>;
    return {
      keys: Object.keys(obj).slice(0, 15),
      sample: Object.fromEntries(Object.entries(obj).slice(0, 5)),
    };
  })();
  console.log("/api/inbound-sms: received", { contentType, shape });

  // TODO: enqueue for processing; for now, ack success quickly
  return NextResponse.json({ ok: true }, { status: 200 });
}
