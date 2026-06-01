import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncChaseEmails, parseChaseEmailSubject } from "@/lib/gmail";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * POST /api/gmail/sync
 *
 * Triggers Gmail sync for Chase email notifications.
 *
 * TODO: Full implementation requires:
 * 1. Google OAuth setup (see lib/gmail.ts)
 * 2. Gmail API credentials in .env
 * 3. User to complete OAuth flow in /settings
 *
 * Request body:
 * {
 *   account: 1 | 2,   // which Gmail account to sync
 *   sinceDate?: string  // ISO date string, defaults to start of current month
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account = 1, sinceDate } = body;

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 });
    }

    const email = account === 1 ? settings.gmailAccount1 : settings.gmailAccount2;
    const token = account === 1 ? settings.gmailToken1 : settings.gmailToken2;

    if (!email || !token) {
      return NextResponse.json({
        error: "Gmail account not connected. Please connect your Gmail account in Settings.",
        connected: false,
      }, { status: 400 });
    }

    const since = sinceDate ? new Date(sinceDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // TODO: This will be a no-op until Gmail OAuth is implemented
    const transactions = await syncChaseEmails(email, token, since);

    let created = 0;
    let skipped = 0;

    for (const tx of transactions) {
      // Check for duplicate by rawEmailId
      if (tx.rawEmailId) {
        const exists = await prisma.transaction.findUnique({
          where: { rawEmailId: tx.rawEmailId },
        });
        if (exists) {
          skipped++;
          continue;
        }
      }

      // Find the budget month for this transaction
      const txDate = new Date(tx.date);
      const budgetMonth = await prisma.budgetMonth.findUnique({
        where: {
          month_year: {
            month: txDate.getMonth() + 1,
            year: txDate.getFullYear(),
          },
        },
      });

      if (!budgetMonth) {
        skipped++;
        continue;
      }

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

    return NextResponse.json({
      success: true,
      message: `Sync complete. Created: ${created}, Skipped: ${skipped}`,
      created,
      skipped,
      total: transactions.length,
    });
  } catch (error) {
    console.error("POST /api/gmail/sync error:", error);
    return NextResponse.json({ error: "Gmail sync failed" }, { status: 500 });
  }
}
