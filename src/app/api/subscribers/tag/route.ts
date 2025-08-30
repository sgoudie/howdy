// Legacy route kept temporarily; responds with 410 Gone to encourage new flow
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: false, status: 410, error: "Deprecated endpoint" }, { status: 410 });
}


