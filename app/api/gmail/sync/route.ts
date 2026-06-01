import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncChaseEmails } from "@/lib/gmail";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/gmail/sync
// Body: { account: 1 | 2, sinceDate?: string (ISO) }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account = 1, sinceDate } = body;

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 });
    }

    const token = account === 1 ? settings.gmailToken1 : settings.gmailToken2;
    const email = account === 1 ? settings.gmailAccount1 : settings.gmailAccount2;

    if (!token) {
      return NextResponse.json({
        error: `Gmail account ${account} is not connected. Please connect it in Settings.`,
        connected: false,
      }, { status: 400 });
    }

    const since = sinceDate
      ? new Date(sinceDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const transactions = await syncChaseEmails(token, since);

    let created = 0;
    let skipped = 0;

    for (const tx of transactions) {
      if (tx.rawEmailId) {
        const exists = await prisma.transaction.findUnique({
          where: { rawEmailId: tx.rawEmailId },
        });
        if (exists) { skipped++; continue; }
      }

      const txDate = new Date(tx.date);
      const budgetMonth = await prisma.budgetMonth.findUnique({
        where: { month_year: { month: txDate.getMonth() + 1, year: txDate.getFullYear() } },
      });

      if (!budgetMonth) { skipped++; continue; }

      await prisma.transaction.create({
        data: {
          budgetMonthId: budgetMonth.id,
          amount: new Decimal(tx.amount),
          merchant: tx.merchant,
          description: tx.description,
          transactionDate: txDate,
          source: "CHASE_EMAIL",
          rawEmailId: tx.rawEmailId || null,
        },
      });
      created++;
    }

    // Stamp last sync time
    await prisma.settings.update({
      where: { id: 1 },
      data: { lastGmailSync: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Sync complete for ${email ?? `account ${account}`}. Created: ${created}, Skipped: ${skipped}`,
      created,
      skipped,
      total: transactions.length,
    });
  } catch (error) {
    console.error("POST /api/gmail/sync error:", error);
    const msg = error instanceof Error ? error.message : "Gmail sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
