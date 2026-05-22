/**
 * Internal webhook called by the Python worker when a hit is found.
 * Protected by WORKER_SECRET header.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendHitEmail } from "@/lib/email/send";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== process.env.WORKER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { to, userName, campgroundName, park, siteName, arriveDate, departDate, bookingUrl } = body;

  if (!to || !campgroundName || !siteName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await sendHitEmail({ to, userName, campgroundName, park, siteName, arriveDate, departDate, bookingUrl });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("sendHitEmail error:", err);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
