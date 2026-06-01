import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncChaseEmails } from "@/lib/gmail";
import { categorizeMerchant } from "@/lib/categorize";
import { Decimal } from "@prisma/client/runtime/library";

// GET /api/cron
// Called daily by Linux cron job to sync Chase emails from both accounts.
// Set up with: crontab -e
// Add line: 0 8 * * * curl -s http://localhost:3000/api/cron
export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return NextResponse.json({ error: "No settings" }, { status: 400 });

  const since = new Date();
  since.setDate(since.getDate() - 2); // look back 2 days to catch any missed

  const results = { account1: { created: 0, skipped: 0 }, account2: { created: 0, skipped: 0 } };

  for (const acct of [1, 2] as const) {
    const token = acct === 1 ? settings.gmailToken1 : settings.gmailToken2;
    if (!token) continue;

    try {
      const transactions = await syncChaseEmails(token, since);

      for (const tx of transactions) {
        if (tx.rawEmailId) {
          const exists = await prisma.transaction.findUnique({ where: { rawEmailId: tx.rawEmailId } });
          if (exists) { results[`account${acct}`].skipped++; continue; }
        }

        const txDate = new Date(tx.date);
        const budgetMonth = await prisma.budgetMonth.findUnique({
          where: { month_year: { month: txDate.getMonth() + 1, year: txDate.getFullYear() } },
        });
        if (!budgetMonth) { results[`account${acct}`].skipped++; continue; }

        const rows = await prisma.budgetRow.findMany({
          where: { budgetMonthId: budgetMonth.id },
          include: { category: true },
        });

        const miscRow = rows.find((r) =>
          r.category.name.toLowerCase().includes("misc") || r.label.toLowerCase().includes("misc")
        );

        const aiRowId = await categorizeMerchant(
          tx.merchant, tx.amount, tx.description,
          rows.map((r) => ({ id: r.id, label: r.label, categoryName: r.category.name }))
        );
        const assignedRowId = aiRowId ?? miscRow?.id ?? null;

        await prisma.transaction.create({
          data: {
            budgetMonthId: budgetMonth.id,
            budgetRowId: assignedRowId,
            amount: new Decimal(tx.amount),
            merchant: tx.merchant,
            description: tx.description,
            transactionDate: txDate,
            source: "CHASE_EMAIL",
            rawEmailId: tx.rawEmailId || null,
          },
        });

        if (assignedRowId) {
          await prisma.budgetRow.update({
            where: { id: assignedRowId },
            data: { actualAmount: { increment: tx.amount } },
          });
        }

        results[`account${acct}`].created++;
      }
    } catch (err) {
      console.error(`Cron sync error for account ${acct}:`, err);
    }
  }

  await prisma.settings.update({
    where: { id: 1 },
    data: { lastGmailSync: new Date() },
  });

  console.log(`[cron] Sync complete:`, results);
  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
}
