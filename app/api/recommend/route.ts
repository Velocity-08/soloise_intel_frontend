import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.SOLIOSE_BACKEND_URL || "";

export async function POST(request: NextRequest) {
  if (!BACKEND) {
    return NextResponse.json({ error: "Backend URL not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const upstream = await fetch(`${BACKEND}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
