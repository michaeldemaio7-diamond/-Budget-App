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
    "wifeNetPaycheck" DECIMAL NOT NULL DEFAULT 7600,
    "job1NetPaycheck" DECIMAL NOT NULL DEFAULT 3400,
    "job2NetPaycheck" DECIMAL NOT NULL DEFAULT 2200,
    "wifePayFrequency" TEXT NOT NULL DEFAULT 'BIWEEKLY',
    "job1PayFrequency" TEXT NOT NULL DEFAULT 'BIWEEKLY',
    "job2PayFrequency" TEXT NOT NULL DEFAULT 'BIMONTHLY',
    "wifeFirstPayDate" TEXT NOT NULL DEFAULT '2025-01-10',
    "job1FirstPayDate" TEXT NOT NULL DEFAULT '2025-01-03',
    "gmailAccount1" TEXT,
    "gmailAccount2" TEXT,
    "gmailToken1" TEXT,
    "gmailToken2" TEXT,
    "lastGmailSync" DATETIME
);
INSERT INTO "new_Settings" ("alertEmail", "gmailAccount1", "gmailAccount2", "gmailToken1", "gmailToken2", "id", "job1FirstPayDate", "job1PayFrequency", "job1SalaryGross", "job2PayFrequency", "job2SalaryGross", "taxRate", "wifeFirstPayDate", "wifePayFrequency", "wifeSalaryGross") SELECT "alertEmail", "gmailAccount1", "gmailAccount2", "gmailToken1", "gmailToken2", "id", "job1FirstPayDate", "job1PayFrequency", "job1SalaryGross", "job2PayFrequency", "job2SalaryGross", "taxRate", "wifeFirstPayDate", "wifePayFrequency", "wifeSalaryGross" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
