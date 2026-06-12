
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendBase() {
  return (process.env.SOLIOSE_BACKEND_URL || process.env.NEXT_PUBLIC_SOLIOSE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  let body: unknown = {};
  try { body = await request.json(); } catch { body = {}; }

  const authorization = request.headers.get("authorization") || "";

  try {
    const upstream = await fetch(`${getBackendBase()}/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {})
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    const text = await upstream.text();
    let payload: any = {};
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = { success: false, error: text }; }
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Upstream unavailable.", code: "UPSTREAM_ERROR" }, { status: 502 });
  }
}

