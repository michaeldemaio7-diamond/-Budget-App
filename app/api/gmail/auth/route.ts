import { NextRequest, NextResponse } from "next/server";
import { generateAuthUrl } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

// GET /api/gmail/auth?account=1|2
// Returns the Google OAuth URL the user should visit to connect their Gmail account.
export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");
  if (account !== "1" && account !== "2") {
    return NextResponse.json({ error: "account must be 1 or 2" }, { status: 400 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured in .env" },
      { status: 503 }
    );
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const loginHint = account === "1" ? settings?.gmailAccount1 : settings?.gmailAccount2;

  const authUrl = generateAuthUrl(account === "1" ? 1 : 2, loginHint ?? undefined);
  return NextResponse.json({ authUrl });
}
