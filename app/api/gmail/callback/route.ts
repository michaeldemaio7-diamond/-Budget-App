import { NextRequest, NextResponse } from "next/server";
import { exchangeOAuthCode } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

// GET /api/gmail/callback?code=...&state=1|2
// Google redirects here after the user grants permission.
// Exchanges the code for tokens and stores the refresh token.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // "1" or "2"
  const error = req.nextUrl.searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?gmailError=${encodeURIComponent(error)}`);
  }

  if (!code || (state !== "1" && state !== "2")) {
    return NextResponse.redirect(`${appUrl}/settings?gmailError=invalid_callback`);
  }

  try {
    const { refreshToken } = await exchangeOAuthCode(code);

    if (state === "1") {
      await prisma.settings.upsert({
        where: { id: 1 },
        update: { gmailToken1: refreshToken },
        create: { id: 1, gmailToken1: refreshToken },
      });
    } else {
      await prisma.settings.upsert({
        where: { id: 1 },
        update: { gmailToken2: refreshToken },
        create: { id: 1, gmailToken2: refreshToken },
      });
    }

    return NextResponse.redirect(`${appUrl}/settings?gmailConnected=${state}`);
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    const msg = err instanceof Error ? err.message : "token_exchange_failed";
    return NextResponse.redirect(`${appUrl}/settings?gmailError=${encodeURIComponent(msg)}`);
  }
}
