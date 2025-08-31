import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("Error reading inbound SMS request body:", error);
  }

  console.log("Inbound SMS webhook body:", rawBody);

  return NextResponse.json({ status: "received" }, { status: 200 });
}


