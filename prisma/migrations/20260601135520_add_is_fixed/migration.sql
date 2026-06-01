-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetRow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "budgetMonthId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "budgetAmount" DECIMAL NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "alertThreshold" DECIMAL NOT NULL DEFAULT 90,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetRow_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetRow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BudgetRow" ("actualAmount", "alertSent", "alertThreshold", "budgetAmount", "budgetMonthId", "categoryId", "createdAt", "id", "label", "notes", "updatedAt") SELECT "actualAmount", "alertSent", "alertThreshold", "budgetAmount", "budgetMonthId", "categoryId", "createdAt", "id", "label", "notes", "updatedAt" FROM "BudgetRow";
DROP TABLE "BudgetRow";
ALTER TABLE "new_BudgetRow" RENAME TO "BudgetRow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
