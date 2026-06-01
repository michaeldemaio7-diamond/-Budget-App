import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseMonthYear(monthYear: string): { month: number; year: number } | null {
  const parts = monthYear.split("-");
  if (parts.length !== 2) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { monthYear: string } }
) {
  try {
    const parsed = parseMonthYear(params.monthYear);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid month/year format. Use YYYY-MM" }, { status: 400 });
    }

    const budgetMonth = await prisma.budgetMonth.findUnique({
      where: { month_year: parsed },
    });

    if (!budgetMonth) {
      return NextResponse.json({ error: "Month not found" }, { status: 404 });
    }

    const [incomes, budgetRows, transactions, settings] = await Promise.all([
      prisma.income.findMany({
        where: { budgetMonthId: budgetMonth.id },
        orderBy: [{ source: "asc" }, { paycheckDate: "asc" }],
      }),
      prisma.budgetRow.findMany({
        where: { budgetMonthId: budgetMonth.id },
        include: { category: true },
        orderBy: [
          { category: { sortOrder: "asc" } },
          { label: "asc" },
        ],
      }),
      prisma.transaction.findMany({
        where: { budgetMonthId: budgetMonth.id },
        include: { budgetRow: { include: { category: true } } },
        orderBy: { transactionDate: "desc" },
      }),
      prisma.settings.findUnique({ where: { id: 1 } }),
    ]);

    return NextResponse.json({
      budgetMonth,
      incomes,
      budgetRows,
      transactions,
      settings,
    });
  } catch (error) {
    console.error("GET /api/months/[monthYear] error:", error);
    return NextResponse.json({ error: "Failed to fetch month data" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { monthYear: string } }
) {
  try {
    const parsed = parseMonthYear(params.monthYear);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid month/year format" }, { status: 400 });
    }

    const body = await req.json();
    const { notes } = body;

    const updated = await prisma.budgetMonth.update({
      where: { month_year: parsed },
      data: { notes },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/months/[monthYear] error:", error);
    return NextResponse.json({ error: "Failed to update month" }, { status: 500 });
  }
}
