import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { calculatePaychecksForMonth } from "../lib/paychecks";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Home",
    icon: "🏠",
    sortOrder: 1,
    rows: [
      { label: "Mortgage",     budgetAmount: 1870, isFixed: true  },
      { label: "Comcast",      budgetAmount: 340,  isFixed: false },
      { label: "Phone",        budgetAmount: 45,   isFixed: true  },
      { label: "Hair",         budgetAmount: 60,   isFixed: true  },
      { label: "Cleaner",      budgetAmount: 300,  isFixed: true  },
      { label: "Security",     budgetAmount: 150,  isFixed: true  },
      { label: "Insurance",    budgetAmount: 150,  isFixed: false },
      { label: "HOA",          budgetAmount: 140,  isFixed: false },
      { label: "Water",        budgetAmount: 70,   isFixed: true  },
      { label: "Garbage",      budgetAmount: 60,   isFixed: true  },
      { label: "PGE",          budgetAmount: 200,  isFixed: false },
      { label: "Pest Control", budgetAmount: 70,   isFixed: true  },
      { label: "Daycare",      budgetAmount: 1904, isFixed: false },
    ],
  },
  {
    name: "Food",
    icon: "🍽️",
    sortOrder: 2,
    rows: [
      { label: "Costco", budgetAmount: 600, isFixed: false },
      { label: "Food",   budgetAmount: 500, isFixed: false },
    ],
  },
  {
    name: "Miscellaneous",
    icon: "📦",
    sortOrder: 3,
    rows: [
      { label: "Miscellaneous", budgetAmount: 3000, isFixed: false },
    ],
  },
  {
    name: "Wife",
    icon: "👩",
    sortOrder: 4,
    rows: [
      { label: "Medical",       budgetAmount: 500,  isFixed: false },
      { label: "Shannon",       budgetAmount: 200,  isFixed: true  },
      { label: "Gym",           budgetAmount: 190,  isFixed: false },
      { label: "Life Insurance",budgetAmount: 150,  isFixed: true  },
      { label: "Kai Rent",      budgetAmount: 550,  isFixed: false },
      { label: "Kai Credit Card",    budgetAmount: 700, isFixed: false },
    ],
  },
  {
    name: "Shannon Bills",
    icon: "💳",
    sortOrder: 45,
    rows: [
      { label: "Timeshare",            budgetAmount: 200, isFixed: true },
      { label: "Youtube",              budgetAmount: 20,  isFixed: true },
      { label: "Tithe",                budgetAmount: 200, isFixed: true },
      { label: "Wax",                  budgetAmount: 85,  isFixed: true },
      { label: "Netflix",              budgetAmount: 20,  isFixed: true },
      { label: "Checking Account Hold",budgetAmount: 300, isFixed: true },
      { label: "Crunch Fitness",       budgetAmount: 85,  isFixed: true },
    ],
  },
  {
    name: "Subscriptions",
    icon: "📱",
    sortOrder: 5,
    rows: [
      { label: "Subscriptions", budgetAmount: 60, isFixed: false },
    ],
  },
  {
    name: "Commute",
    icon: "🚗",
    sortOrder: 6,
    rows: [
      { label: "Commute",          budgetAmount: 250, isFixed: true },
      { label: "Model 3 Payment",  budgetAmount: 270, isFixed: true },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      taxRate: new Decimal(0.3),
      wifeSalaryGross: new Decimal(160000),
      job1SalaryGross: new Decimal(130000),
      job2SalaryGross: new Decimal(75000),
      wifeNetPaycheck: new Decimal(3800),
      job1NetPaycheck: new Decimal(3400),
      job2NetPaycheck: new Decimal(2200),
      gmailAccount1: "michaeldemaio7@gmail.com",
      gmailAccount2: "shanibebe@gmail.com",
      alertEmail: "michaeldemaio7@gmail.com",
      wifeFirstPayDate: "2026-05-29",
      job1FirstPayDate: "2026-05-29",
    },
    create: {
      id: 1,
      taxRate: new Decimal(0.3),
      wifeSalaryGross: new Decimal(160000),
      job1SalaryGross: new Decimal(130000),
      job2SalaryGross: new Decimal(75000),
      wifeNetPaycheck: new Decimal(3800),
      job1NetPaycheck: new Decimal(3400),
      job2NetPaycheck: new Decimal(2200),
      gmailAccount1: "michaeldemaio7@gmail.com",
      gmailAccount2: "shanibebe@gmail.com",
      alertEmail: "michaeldemaio7@gmail.com",
      wifeFirstPayDate: "2026-05-29",
      job1FirstPayDate: "2026-05-29",
    },
  });

  // Delete rows first (they reference categories), then categories
  await prisma.budgetRow.deleteMany({});
  await prisma.budgetCategory.deleteMany({});

  for (const cat of categories) {
    await prisma.budgetCategory.create({
      data: {
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }

  const june2026 = await prisma.budgetMonth.upsert({
    where: { month_year: { month: 6, year: 2026 } },
    update: {},
    create: { month: 6, year: 2026 },
  });

  // Rows already cleared above — create fresh for June 2026

  const dbCategories = await prisma.budgetCategory.findMany({ orderBy: { sortOrder: "asc" } });

  for (const cat of categories) {
    const dbCat = dbCategories.find((c) => c.name === cat.name);
    if (!dbCat) continue;

    const isHome = cat.name === "Home";
    const isShannonBills = cat.name === "Shannon Bills";
    for (const row of cat.rows) {
      const prefill =
        isHome ||
        (isShannonBills && row.label !== "Checking Account Hold") ||
        (cat.name === "Commute" && row.label === "Model 3 Payment");
      await prisma.budgetRow.create({
        data: {
          budgetMonthId: june2026.id,
          categoryId: dbCat.id,
          label: row.label,
          budgetAmount: new Decimal(row.budgetAmount),
          actualAmount: new Decimal(prefill ? row.budgetAmount : 0),
          isFixed: row.isFixed,
        },
      });
    }
  }

  // Income entries
  await prisma.income.deleteMany({ where: { budgetMonthId: june2026.id } });

  const paychecks = calculatePaychecksForMonth(2026, 6, {
    wifeNetPaycheck: 3800,
    job1NetPaycheck: 3400,
    job2NetPaycheck: 2200,
    wifeFirstPayDate: "2026-05-29",
    job1FirstPayDate: "2026-05-29",
  });

  for (const pc of paychecks) {
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

  await prisma.income.create({
    data: {
      budgetMonthId: june2026.id,
      source: "COMMISSION",
      amount: new Decimal(0),
      label: "Commission",
      isManual: true,
    },
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
