import { NextResponse } from "next/server";
import { subscribeEmailToTag } from "@/features/subscribers/lib/convertkit";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Use POST /api/subscribers with { email }" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const tag = typeof body?.tag === "string" ? body.tag : undefined;

    const result = await subscribeEmailToTag(email, tag || "source-howdy");

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: result.status || 500,
          error: result.error,
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({ ok: true, status: result.status }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { ok: false, status: 500, error: message },
      { status: 500 }
    );
  }
}


