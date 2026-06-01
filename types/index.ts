export type IncomeSource =
  | "WIFE_SALARY"
  | "JOB1_SALARY"
  | "JOB2_SALARY"
  | "COMMISSION"
  | "OTHER";

export type TransactionSource = "CHASE_EMAIL" | "MANUAL";

export type AlertType = "EMAIL" | "SMS";

export interface BudgetMonth {
  id: number;
  month: number;
  year: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: number;
  budgetMonthId: number;
  source: IncomeSource;
  amount: string | number;
  paycheckDate?: string | null;
  label?: string | null;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: number;
  name: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface BudgetRow {
  id: number;
  budgetMonthId: number;
  categoryId: number;
  label: string;
  budgetAmount: string | number;
  actualAmount: string | number;
  notes?: string | null;
  alertThreshold: string | number;
  alertSent: boolean;
  createdAt: string;
  updatedAt: string;
  category?: BudgetCategory;
  transactions?: Transaction[];
}

export interface Transaction {
  id: number;
  budgetRowId?: number | null;
  budgetMonthId: number;
  amount: string | number;
  merchant: string;
  description?: string | null;
  transactionDate: string;
  source: TransactionSource;
  rawEmailId?: string | null;
  createdAt: string;
  budgetRow?: BudgetRow | null;
}

export interface Alert {
  id: number;
  budgetRowId: number;
  type: AlertType;
  sentAt: string;
  message: string;
}

export interface Settings {
  id: number;
  alertEmail?: string | null;
  taxRate: string | number;
  wifeSalaryGross: string | number;
  job1SalaryGross: string | number;
  job2SalaryGross: string | number;
  wifePayFrequency: string;
  job1PayFrequency: string;
  job2PayFrequency: string;
  wifeFirstPayDate: string;
  job1FirstPayDate: string;
  gmailAccount1?: string | null;
  gmailAccount2?: string | null;
  gmailToken1?: string | null;
  gmailToken2?: string | null;
}

export interface MonthData {
  budgetMonth: BudgetMonth;
  incomes: Income[];
  budgetRows: BudgetRowWithCategory[];
  transactions: Transaction[];
  settings: Settings;
}

export interface BudgetRowWithCategory extends BudgetRow {
  category: BudgetCategory;
}

export interface CategorySummary {
  category: BudgetCategory;
  rows: BudgetRowWithCategory[];
  totalBudget: number;
  totalActual: number;
  totalRemaining: number;
  percentUsed: number;
}

export interface IncomeSummaryRow {
  source: IncomeSource;
  label: string;
  expected: number;
  received: number;
  variance: number;
  paycheckCount: number;
}
