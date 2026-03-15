import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public endpoint to record a page visit. Call from client (e.g. app layout)
 * with optional query params: utm_source, utm_medium, utm_campaign, country.
 * session_id should be a stable client id (e.g. from cookie or localStorage).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId =
      (body.session_id ?? body.sessionId ?? request.headers.get("x-session-id")) as string;
    const path = (body.path ?? "/").slice(0, 500);
    const country = (body.country ?? "").slice(0, 100) || null;
    const utmSource = (body.utm_source ?? "").slice(0, 100) || null;
    const utmMedium = (body.utm_medium ?? "").slice(0, 100) || null;
    const utmCampaign = (body.utm_campaign ?? "").slice(0, 200) || null;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: { message: "session_id required" } },
        { status: 400 }
      );
    }

    await prisma.analyticsVisit.create({
      data: {
        sessionId: sessionId.slice(0, 64),
        path: path || "/",
        country,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Analytics track error:", e);
    return NextResponse.json(
      { error: { message: "Track failed" } },
      { status: 500 }
    );
  }
}
