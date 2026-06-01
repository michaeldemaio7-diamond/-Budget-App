import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const budgetMonthId = searchParams.get("budgetMonthId");

    const where = budgetMonthId ? { budgetMonthId: parseInt(budgetMonthId) } : {};
    const incomes = await prisma.income.findMany({
      where,
      orderBy: [{ source: "asc" }, { paycheckDate: "asc" }],
    });
    return NextResponse.json(incomes);
  } catch (error) {
    console.error("GET /api/income error:", error);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budgetMonthId, source, amount, paycheckDate, label, isManual } = body;

    if (!budgetMonthId || !source || amount === undefined) {
      return NextResponse.json(
        { error: "budgetMonthId, source, and amount are required" },
        { status: 400 }
      );
    }

    const income = await prisma.income.create({
      data: {
        budgetMonthId,
        source,
        amount: new Decimal(amount),
        paycheckDate: paycheckDate ? new Date(paycheckDate) : null,
        label: label || null,
        isManual: isManual ?? true,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error("POST /api/income error:", error);
    return NextResponse.json({ error: "Failed to create income entry" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, amount, label, paycheckDate } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const income = await prisma.income.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: new Decimal(amount) }),
        ...(label !== undefined && { label }),
        ...(paycheckDate !== undefined && { paycheckDate: paycheckDate ? new Date(paycheckDate) : null }),
      },
    });

    return NextResponse.json(income);
  } catch (error) {
    console.error("PATCH /api/income error:", error);
    return NextResponse.json({ error: "Failed to update income entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.income.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/income error:", error);
    return NextResponse.json({ error: "Failed to delete income entry" }, { status: 500 });
  }
}
