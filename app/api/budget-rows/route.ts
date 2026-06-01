import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const budgetMonthId = searchParams.get("budgetMonthId");
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = {};
    if (budgetMonthId) where.budgetMonthId = parseInt(budgetMonthId);
    if (categoryId) where.categoryId = parseInt(categoryId);

    const rows = await prisma.budgetRow.findMany({
      where,
      include: { category: true },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { label: "asc" },
      ],
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/budget-rows error:", error);
    return NextResponse.json({ error: "Failed to fetch budget rows" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budgetMonthId, categoryId, label, budgetAmount, notes, alertThreshold } = body;

    if (!budgetMonthId || !categoryId || !label) {
      return NextResponse.json(
        { error: "budgetMonthId, categoryId, and label are required" },
        { status: 400 }
      );
    }

    const row = await prisma.budgetRow.create({
      data: {
        budgetMonthId,
        categoryId,
        label,
        budgetAmount: new Decimal(budgetAmount || 0),
        actualAmount: new Decimal(0),
        notes: notes || null,
        alertThreshold: new Decimal(alertThreshold || 90),
      },
      include: { category: true },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("POST /api/budget-rows error:", error);
    return NextResponse.json({ error: "Failed to create budget row" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, budgetAmount, actualAmount, notes, alertThreshold, label } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const row = await prisma.budgetRow.update({
      where: { id },
      data: {
        ...(budgetAmount !== undefined && { budgetAmount: new Decimal(budgetAmount) }),
        ...(actualAmount !== undefined && { actualAmount: new Decimal(actualAmount) }),
        ...(notes !== undefined && { notes }),
        ...(alertThreshold !== undefined && { alertThreshold: new Decimal(alertThreshold) }),
        ...(label !== undefined && { label }),
      },
      include: { category: true },
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error("PATCH /api/budget-rows error:", error);
    return NextResponse.json({ error: "Failed to update budget row" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.budgetRow.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/budget-rows error:", error);
    return NextResponse.json({ error: "Failed to delete budget row" }, { status: 500 });
  }
}
