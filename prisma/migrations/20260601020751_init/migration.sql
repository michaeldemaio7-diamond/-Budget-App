-- CreateTable
CREATE TABLE "BudgetMonth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Income" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "budgetMonthId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paycheckDate" DATETIME,
    "label" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Income_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BudgetRow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "budgetMonthId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "budgetAmount" DECIMAL NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "alertThreshold" DECIMAL NOT NULL DEFAULT 90,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetRow_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "budgetRowId" INTEGER,
    "budgetMonthId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "merchant" TEXT NOT NULL,
    "description" TEXT,
    "transactionDate" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "rawEmailId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_budgetRowId_fkey" FOREIGN KEY ("budgetRowId") REFERENCES "BudgetRow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "budgetRowId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    CONSTRAINT "Alert_budgetRowId_fkey" FOREIGN KEY ("budgetRowId") REFERENCES "BudgetRow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "alertEmail" TEXT,
    "alertPhone" TEXT,
    "taxRate" DECIMAL NOT NULL DEFAULT 0.30,
    "wifeSalaryGross" DECIMAL NOT NULL DEFAULT 160000,
    "job1SalaryGross" DECIMAL NOT NULL DEFAULT 130000,
    "job2SalaryGross" DECIMAL NOT NULL DEFAULT 75000,
    "wifePayFrequency" TEXT NOT NULL DEFAULT 'BIWEEKLY',
    "job1PayFrequency" TEXT NOT NULL DEFAULT 'BIWEEKLY',
    "job2PayFrequency" TEXT NOT NULL DEFAULT 'BIMONTHLY',
    "wifeFirstPayDate" TEXT NOT NULL DEFAULT '2025-01-10',
    "job1FirstPayDate" TEXT NOT NULL DEFAULT '2025-01-03',
    "gmailAccount1" TEXT,
    "gmailAccount2" TEXT,
    "gmailToken1" TEXT,
    "gmailToken2" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetMonth_month_year_key" ON "BudgetMonth"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_rawEmailId_key" ON "Transaction"("rawEmailId");
