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
  { params }: { params: Promise<{ monthYear: string }> }
) {
  try {
    const { monthYear } = await params;
    const parsed = parseMonthYear(monthYear);
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

    // Auto-fill actualAmount=budgetAmount where actual is still 0:
    // - Home: all rows
    // - Shannon Bills: all rows except "Checking Account Hold"
    const rowsToFill = budgetRows.filter((r) => {
      if (parseFloat(r.actualAmount.toString()) !== 0) return false;
      if (r.category.name === "Home") return true;
      if (r.category.name === "Shannon Bills" && r.label !== "Checking Account Hold") return true;
      if (r.category.name === "Commute" && r.label === "Model 3 Payment") return true;
      return false;
    });
    if (rowsToFill.length > 0) {
      await Promise.all(
        rowsToFill.map((r) =>
          prisma.budgetRow.update({
            where: { id: r.id },
            data: { actualAmount: r.budgetAmount },
          })
        )
      );
      budgetRows.forEach((r) => {
        if (rowsToFill.some((h) => h.id === r.id)) {
          r.actualAmount = r.budgetAmount;
        }
      });
    }

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
  { params }: { params: Promise<{ monthYear: string }> }
) {
  try {
    const { monthYear } = await params;
    const parsed = parseMonthYear(monthYear);
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
