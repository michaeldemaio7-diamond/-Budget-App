import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const budgetMonthId = searchParams.get("budgetMonthId");
    const budgetRowId = searchParams.get("budgetRowId");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const unassigned = searchParams.get("unassigned");

    const where: Record<string, unknown> = {};
    if (budgetMonthId) where.budgetMonthId = parseInt(budgetMonthId);
    if (budgetRowId) where.budgetRowId = parseInt(budgetRowId);
    if (source) where.source = source;
    if (unassigned === "true") where.budgetRowId = null;
    if (search) {
      where.OR = [
        { merchant: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        budgetRow: { include: { category: true } },
      },
      orderBy: { transactionDate: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      budgetMonthId,
      budgetRowId,
      amount,
      merchant,
      description,
      transactionDate,
      source,
      rawEmailId,
    } = body;

    if (!budgetMonthId || !amount || !merchant || !transactionDate) {
      return NextResponse.json(
        { error: "budgetMonthId, amount, merchant, and transactionDate are required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        budgetMonthId,
        budgetRowId: budgetRowId || null,
        amount: new Decimal(amount),
        merchant,
        description: description || null,
        transactionDate: new Date(transactionDate),
        source: source || "MANUAL",
        rawEmailId: rawEmailId || null,
      },
      include: {
        budgetRow: { include: { category: true } },
      },
    });

    // If assigned to a row, update actualAmount
    if (budgetRowId) {
      await prisma.budgetRow.update({
        where: { id: budgetRowId },
        data: { actualAmount: { increment: parseFloat(amount) } },
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, merchant, description, transactionDate, amount } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(merchant !== undefined && { merchant }),
        ...(description !== undefined && { description }),
        ...(transactionDate !== undefined && { transactionDate: new Date(transactionDate) }),
        ...(amount !== undefined && { amount: new Decimal(amount) }),
      },
      include: {
        budgetRow: { include: { category: true } },
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("PATCH /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Get transaction to update budget row
    const tx = await prisma.transaction.findUnique({ where: { id: parseInt(id) } });
    if (tx?.budgetRowId) {
      const amt = parseFloat(tx.amount.toString());
      await prisma.budgetRow.update({
        where: { id: tx.budgetRowId },
        data: { actualAmount: { decrement: amt } },
      });
    }

    await prisma.transaction.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
