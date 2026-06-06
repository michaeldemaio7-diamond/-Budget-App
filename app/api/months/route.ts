import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePaychecksForMonth } from "@/lib/paychecks";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  try {
    const months = await prisma.budgetMonth.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return NextResponse.json(months);
  } catch (error) {
    console.error("GET /api/months error:", error);
    return NextResponse.json({ error: "Failed to fetch months" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, year, notes } = body;

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.budgetMonth.findUnique({
      where: { month_year: { month, year } },
    });
    if (existing) {
      return NextResponse.json({ error: "Month already exists" }, { status: 409 });
    }

    // Get settings
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });

    // Create the month
    const budgetMonth = await prisma.budgetMonth.create({
      data: { month, year, notes },
    });

    // Get all categories
    const categories = await prisma.budgetCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Try to copy from previous month, else create defaults
    const prevMonthNum = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = await prisma.budgetMonth.findUnique({
      where: { month_year: { month: prevMonthNum, year: prevYear } },
      include: { budgetRows: true },
    });

    if (prevMonth && prevMonth.budgetRows.length > 0) {
      // Copy rows from previous month; pre-fill actuals for Home category
      const homeCategory = categories.find((c) => c.name === "Home");
      for (const row of prevMonth.budgetRows) {
        const prefill = homeCategory && row.categoryId === homeCategory.id;
        await prisma.budgetRow.create({
          data: {
            budgetMonthId: budgetMonth.id,
            categoryId: row.categoryId,
            label: row.label,
            budgetAmount: row.budgetAmount,
            actualAmount: prefill ? row.budgetAmount : new Decimal(0),
            notes: row.notes,
            alertThreshold: row.alertThreshold,
          },
        });
      }
    } else {
      // Create default rows from seed data
      const defaultRows: Record<string, { label: string; amount: number }[]> = {
        Housing: [
          { label: "Mortgage/Rent", amount: 2500 },
          { label: "HOA", amount: 200 },
          { label: "Home Insurance", amount: 150 },
          { label: "Property Tax", amount: 400 },
        ],
        Utilities: [
          { label: "Electric", amount: 150 },
          { label: "Gas", amount: 80 },
          { label: "Water", amount: 60 },
          { label: "Internet", amount: 80 },
          { label: "Phone", amount: 120 },
        ],
        Transportation: [
          { label: "Car Payment 1", amount: 500 },
          { label: "Car Payment 2", amount: 450 },
          { label: "Car Insurance", amount: 250 },
          { label: "Gas/Fuel", amount: 200 },
          { label: "Tolls/Parking", amount: 50 },
        ],
        Food: [
          { label: "Groceries", amount: 800 },
          { label: "Dining Out", amount: 400 },
          { label: "Coffee/Snacks", amount: 100 },
        ],
        Health: [
          { label: "Health Insurance", amount: 400 },
          { label: "Dental", amount: 50 },
          { label: "Vision", amount: 30 },
          { label: "Prescriptions", amount: 50 },
          { label: "Gym", amount: 100 },
        ],
        Personal: [
          { label: "Clothing", amount: 200 },
          { label: "Hair/Beauty", amount: 150 },
          { label: "Entertainment", amount: 200 },
          { label: "Subscriptions", amount: 100 },
        ],
        "Kids/Family": [
          { label: "Childcare", amount: 1500 },
          { label: "School", amount: 300 },
          { label: "Activities", amount: 200 },
          { label: "Baby Supplies", amount: 150 },
        ],
        Savings: [
          { label: "Emergency Fund", amount: 500 },
          { label: "Retirement (401k)", amount: 1000 },
          { label: "Investments", amount: 500 },
          { label: "Other Savings", amount: 250 },
        ],
        Debt: [
          { label: "Credit Card Payments", amount: 500 },
          { label: "Student Loans", amount: 300 },
          { label: "Personal Loans", amount: 0 },
        ],
        Miscellaneous: [
          { label: "Travel", amount: 300 },
          { label: "Gifts", amount: 150 },
          { label: "Charity", amount: 100 },
          { label: "Other", amount: 200 },
        ],
      };

      for (const cat of categories) {
        const rows = defaultRows[cat.name] || [];
        for (const row of rows) {
          await prisma.budgetRow.create({
            data: {
              budgetMonthId: budgetMonth.id,
              categoryId: cat.id,
              label: row.label,
              budgetAmount: new Decimal(row.amount),
              actualAmount: new Decimal(0),
            },
          });
        }
      }
    }

    // Create income entries from paycheck calculation
    const taxRate = settings ? parseFloat(settings.taxRate.toString()) : 0.3;
    const paychecks = calculatePaychecksForMonth(year, month, {
      taxRate,
      wifeSalaryGross: settings ? parseFloat(settings.wifeSalaryGross.toString()) : 160000,
      job1SalaryGross: settings ? parseFloat(settings.job1SalaryGross.toString()) : 130000,
      job2SalaryGross: settings ? parseFloat(settings.job2SalaryGross.toString()) : 75000,
      wifeFirstPayDate: settings?.wifeFirstPayDate || "2025-01-10",
      job1FirstPayDate: settings?.job1FirstPayDate || "2025-01-03",
    });

    for (const pc of paychecks) {
      await prisma.income.create({
        data: {
          budgetMonthId: budgetMonth.id,
          source: pc.source,
          amount: new Decimal(pc.amount),
          paycheckDate: pc.date,
          label: pc.label,
          isManual: false,
        },
      });
    }

    // Add blank commission entry
    await prisma.income.create({
      data: {
        budgetMonthId: budgetMonth.id,
        source: "COMMISSION",
        amount: new Decimal(0),
        label: "Commission",
        isManual: true,
      },
    });

    return NextResponse.json(budgetMonth, { status: 201 });
  } catch (error) {
    console.error("POST /api/months error:", error);
    return NextResponse.json({ error: "Failed to create month" }, { status: 500 });
  }
}
