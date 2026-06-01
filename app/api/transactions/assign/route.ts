import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, budgetRowId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    // Get existing transaction
    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const txAmount = parseFloat(existing.amount.toString());

    // Remove from old row if it had one
    if (existing.budgetRowId) {
      await prisma.budgetRow.update({
        where: { id: existing.budgetRowId },
        data: { actualAmount: { decrement: txAmount } },
      });
    }

    // Assign to new row (or unassign if budgetRowId is null)
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { budgetRowId: budgetRowId || null },
      include: {
        budgetRow: { include: { category: true } },
      },
    });

    // Add to new row if specified
    if (budgetRowId) {
      await prisma.budgetRow.update({
        where: { id: budgetRowId },
        data: { actualAmount: { increment: txAmount } },
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("POST /api/transactions/assign error:", error);
    return NextResponse.json({ error: "Failed to assign transaction" }, { status: 500 });
  }
}
