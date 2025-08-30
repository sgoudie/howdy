import { NextResponse } from "next/server";
import { getTagInfo } from "@/features/subscribers/lib/convertkit";

export async function GET() {
  const result = await getTagInfo();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, status: result.status, error: result.error },
      { status: result.status || 500 }
    );
  }
  return NextResponse.json(
    { ok: true, status: result.status, id: result.id, name: result.name },
    { status: 200 }
  );
}


