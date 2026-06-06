-- CreateTable
CREATE TABLE "MonthlySavings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "actualSavingsEOM" DECIMAL NOT NULL DEFAULT 0,
    "cumulativeSavings" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "alertEmail" TEXT,
    "taxRate" DECIMAL NOT NULL DEFAULT 0.30,
    "wifeSalaryGross" DECIMAL NOT NULL DEFAULT 160000,
    "job1SalaryGross" DECIMAL NOT NULL DEFAULT 130000,
    "job2SalaryGross" DECIMAL NOT NULL DEFAULT 75000,
    "wifeNetPaycheck" DECIMAL NOT NULL DEFAULT 3800,
    "job1NetPaycheck" DECIMAL NOT NULL DEFAULT 3400,
    "job2NetPaycheck" DECIMAL NOT NULL DEFAULT 2200,
    "wifePayFrequency" TEXT NOT NULL DEFAULT 'BIWEEKLY',
    "job1PayFrequency" TEXT NOT NULL DEFAULT 'BIWEEKLY',
    "job2PayFrequency" TEXT NOT NULL DEFAULT 'BIMONTHLY',
    "wifeFirstPayDate" TEXT NOT NULL DEFAULT '2026-05-29',
    "job1FirstPayDate" TEXT NOT NULL DEFAULT '2026-05-29',
    "gmailAccount1" TEXT,
    "gmailAccount2" TEXT,
    "gmailToken1" TEXT,
    "gmailToken2" TEXT,
    "lastGmailSync" DATETIME
);
INSERT INTO "new_Settings" ("alertEmail", "gmailAccount1", "gmailAccount2", "gmailToken1", "gmailToken2", "id", "job1FirstPayDate", "job1NetPaycheck", "job1PayFrequency", "job1SalaryGross", "job2NetPaycheck", "job2PayFrequency", "job2SalaryGross", "lastGmailSync", "taxRate", "wifeFirstPayDate", "wifeNetPaycheck", "wifePayFrequency", "wifeSalaryGross") SELECT "alertEmail", "gmailAccount1", "gmailAccount2", "gmailToken1", "gmailToken2", "id", "job1FirstPayDate", "job1NetPaycheck", "job1PayFrequency", "job1SalaryGross", "job2NetPaycheck", "job2PayFrequency", "job2SalaryGross", "lastGmailSync", "taxRate", "wifeFirstPayDate", "wifeNetPaycheck", "wifePayFrequency", "wifeSalaryGross" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySavings_month_year_key" ON "MonthlySavings"("month", "year");
