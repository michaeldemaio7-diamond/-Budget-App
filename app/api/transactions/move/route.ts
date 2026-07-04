import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/transactions/move
// Moves a transaction to a different budget month.
// Reverses actualAmount on the old budget row, clears the row assignment
// (since row IDs are month-specific), and sets the new budgetMonthId.
export async function POST(req: NextRequest) {
  try {
    const { transactionId, month, year } = await req.json();

    if (!transactionId || !month || !year) {
      return NextResponse.json({ error: "transactionId, month, and year are required" }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const newMonth = await prisma.budgetMonth.findUnique({
      where: { month_year: { month, year } },
    });
    if (!newMonth) return NextResponse.json({ error: "Target month not found" }, { status: 404 });

    // If already in this month, do nothing
    if (tx.budgetMonthId === newMonth.id) return NextResponse.json({ success: true });

    // Reverse actualAmount on old budget row
    if (tx.budgetRowId) {
      await prisma.budgetRow.update({
        where: { id: tx.budgetRowId },
        data: { actualAmount: { decrement: new Decimal(tx.amount.toString()) } },
      });
    }

    // Move transaction to new month, clear row assignment (rows are month-specific)
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        budgetMonthId: newMonth.id,
        budgetRowId: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/transactions/move error:", error);
    return NextResponse.json({ error: "Failed to move transaction" }, { status: 500 });
  }
}
