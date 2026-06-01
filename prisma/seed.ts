import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { calculatePaychecksForMonth } from "../lib/paychecks";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Housing",
    icon: "🏠",
    sortOrder: 1,
    rows: [
      { label: "Mortgage/Rent", budgetAmount: 2500 },
      { label: "HOA", budgetAmount: 200 },
      { label: "Home Insurance", budgetAmount: 150 },
      { label: "Property Tax", budgetAmount: 400 },
    ],
  },
  {
    name: "Utilities",
    icon: "⚡",
    sortOrder: 2,
    rows: [
      { label: "Electric", budgetAmount: 150 },
      { label: "Gas", budgetAmount: 80 },
      { label: "Water", budgetAmount: 60 },
      { label: "Internet", budgetAmount: 80 },
      { label: "Phone", budgetAmount: 120 },
    ],
  },
  {
    name: "Transportation",
    icon: "🚗",
    sortOrder: 3,
    rows: [
      { label: "Car Payment 1", budgetAmount: 500 },
      { label: "Car Payment 2", budgetAmount: 450 },
      { label: "Car Insurance", budgetAmount: 250 },
      { label: "Gas/Fuel", budgetAmount: 200 },
      { label: "Tolls/Parking", budgetAmount: 50 },
    ],
  },
  {
    name: "Food",
    icon: "🍽️",
    sortOrder: 4,
    rows: [
      { label: "Groceries", budgetAmount: 800 },
      { label: "Dining Out", budgetAmount: 400 },
      { label: "Coffee/Snacks", budgetAmount: 100 },
    ],
  },
  {
    name: "Health",
    icon: "💊",
    sortOrder: 5,
    rows: [
      { label: "Health Insurance", budgetAmount: 400 },
      { label: "Dental", budgetAmount: 50 },
      { label: "Vision", budgetAmount: 30 },
      { label: "Prescriptions", budgetAmount: 50 },
      { label: "Gym", budgetAmount: 100 },
    ],
  },
  {
    name: "Personal",
    icon: "👤",
    sortOrder: 6,
    rows: [
      { label: "Clothing", budgetAmount: 200 },
      { label: "Hair/Beauty", budgetAmount: 150 },
      { label: "Entertainment", budgetAmount: 200 },
      { label: "Subscriptions", budgetAmount: 100 },
    ],
  },
  {
    name: "Kids/Family",
    icon: "👨‍👩‍👧‍👦",
    sortOrder: 7,
    rows: [
      { label: "Childcare", budgetAmount: 1500 },
      { label: "School", budgetAmount: 300 },
      { label: "Activities", budgetAmount: 200 },
      { label: "Baby Supplies", budgetAmount: 150 },
    ],
  },
  {
    name: "Savings",
    icon: "💰",
    sortOrder: 8,
    rows: [
      { label: "Emergency Fund", budgetAmount: 500 },
      { label: "Retirement (401k)", budgetAmount: 1000 },
      { label: "Investments", budgetAmount: 500 },
      { label: "Other Savings", budgetAmount: 250 },
    ],
  },
  {
    name: "Debt",
    icon: "💳",
    sortOrder: 9,
    rows: [
      { label: "Credit Card Payments", budgetAmount: 500 },
      { label: "Student Loans", budgetAmount: 300 },
      { label: "Personal Loans", budgetAmount: 0 },
    ],
  },
  {
    name: "Miscellaneous",
    icon: "📦",
    sortOrder: 10,
    rows: [
      { label: "Travel", budgetAmount: 300 },
      { label: "Gifts", budgetAmount: 150 },
      { label: "Charity", budgetAmount: 100 },
      { label: "Other", budgetAmount: 200 },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  // Create settings
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      taxRate: new Decimal(0.3),
      wifeSalaryGross: new Decimal(160000),
      job1SalaryGross: new Decimal(130000),
      job2SalaryGross: new Decimal(75000),
    },
  });

  // Create categories
  for (const cat of categories) {
    await prisma.budgetCategory.upsert({
      where: { id: cat.sortOrder },
      update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
      create: {
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }

  // Create June 2026 budget month
  const june2026 = await prisma.budgetMonth.upsert({
    where: { month_year: { month: 6, year: 2026 } },
    update: {},
    create: { month: 6, year: 2026 },
  });

  // Create budget rows for June 2026
  const dbCategories = await prisma.budgetCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  for (const cat of categories) {
    const dbCat = dbCategories.find((c) => c.name === cat.name);
    if (!dbCat) continue;

    for (const row of cat.rows) {
      const exists = await prisma.budgetRow.findFirst({
        where: {
          budgetMonthId: june2026.id,
          categoryId: dbCat.id,
          label: row.label,
        },
      });

      if (!exists) {
        await prisma.budgetRow.create({
          data: {
            budgetMonthId: june2026.id,
            categoryId: dbCat.id,
            label: row.label,
            budgetAmount: new Decimal(row.budgetAmount),
            actualAmount: new Decimal(0),
          },
        });
      }
    }
  }

  // Create income entries for June 2026 based on paycheck calc
  const paychecks = calculatePaychecksForMonth(2026, 6, {
    taxRate: 0.3,
    wifeSalaryGross: 160000,
    job1SalaryGross: 130000,
    job2SalaryGross: 75000,
    wifeFirstPayDate: "2025-01-10",
    job1FirstPayDate: "2025-01-03",
  });

  for (const pc of paychecks) {
    const exists = await prisma.income.findFirst({
      where: {
        budgetMonthId: june2026.id,
        source: pc.source,
        paycheckDate: pc.date,
      },
    });

    if (!exists) {
      await prisma.income.create({
        data: {
          budgetMonthId: june2026.id,
          source: pc.source,
          amount: new Decimal(pc.amount),
          paycheckDate: pc.date,
          label: pc.label,
          isManual: false,
        },
      });
    }
  }

  // Add a sample commission entry
  const commissionExists = await prisma.income.findFirst({
    where: {
      budgetMonthId: june2026.id,
      source: "COMMISSION",
    },
  });

  if (!commissionExists) {
    await prisma.income.create({
      data: {
        budgetMonthId: june2026.id,
        source: "COMMISSION",
        amount: new Decimal(0),
        label: "Commission",
        isManual: true,
      },
    });
  }

  // Add some sample transactions for June 2026
  const groceryRow = await prisma.budgetRow.findFirst({
    where: { budgetMonthId: june2026.id, label: "Groceries" },
  });
  const diningRow = await prisma.budgetRow.findFirst({
    where: { budgetMonthId: june2026.id, label: "Dining Out" },
  });
  const gasRow = await prisma.budgetRow.findFirst({
    where: { budgetMonthId: june2026.id, label: "Gas/Fuel" },
  });

  const sampleTransactions = [
    {
      merchant: "Whole Foods Market",
      amount: 127.43,
      description: "Grocery shopping",
      date: new Date("2026-06-02"),
      rowId: groceryRow?.id,
    },
    {
      merchant: "Chipotle",
      amount: 42.5,
      description: "Lunch",
      date: new Date("2026-06-03"),
      rowId: diningRow?.id,
    },
    {
      merchant: "Shell Gas Station",
      amount: 68.22,
      description: "Gas fill-up",
      date: new Date("2026-06-04"),
      rowId: gasRow?.id,
    },
    {
      merchant: "Target",
      amount: 95.67,
      description: "Household items",
      date: new Date("2026-06-05"),
      rowId: groceryRow?.id,
    },
    {
      merchant: "Starbucks",
      amount: 12.4,
      description: "Coffee",
      date: new Date("2026-06-06"),
      rowId: null,
    },
  ];

  for (const tx of sampleTransactions) {
    const exists = await prisma.transaction.findFirst({
      where: {
        budgetMonthId: june2026.id,
        merchant: tx.merchant,
        transactionDate: tx.date,
      },
    });

    if (!exists) {
      const created = await prisma.transaction.create({
        data: {
          budgetMonthId: june2026.id,
          budgetRowId: tx.rowId,
          amount: new Decimal(tx.amount),
          merchant: tx.merchant,
          description: tx.description,
          transactionDate: tx.date,
          source: "MANUAL",
        },
      });

      // Update actualAmount on the budget row if assigned
      if (tx.rowId) {
        await prisma.budgetRow.update({
          where: { id: tx.rowId },
          data: {
            actualAmount: {
              increment: tx.amount,
            },
          },
        });
      }
    }
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
