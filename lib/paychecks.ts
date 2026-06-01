export type PaycheckSource = "WIFE_SALARY" | "JOB1_SALARY" | "JOB2_SALARY" | "COMMISSION" | "OTHER";

export interface Paycheck {
  date: Date;
  amount: number;
  source: PaycheckSource;
  label: string;
}

export interface PaycheckSettings {
  taxRate: number;
  wifeSalaryGross: number;
  job1SalaryGross: number;
  job2SalaryGross: number;
  wifeNetPaycheck?: number;
  job1NetPaycheck?: number;
  job2NetPaycheck?: number;
  wifeFirstPayDate: string;
  job1FirstPayDate: string;
}

const DEFAULT_SETTINGS: PaycheckSettings = {
  taxRate: 0.3,
  wifeSalaryGross: 160000,
  job1SalaryGross: 130000,
  job2SalaryGross: 75000,
  wifeNetPaycheck: 7600,
  job1NetPaycheck: 3400,
  job2NetPaycheck: 2200,
  wifeFirstPayDate: "2025-01-10",
  job1FirstPayDate: "2025-01-03",
};

function getBiweeklyDatesInMonth(year: number, month: number, firstPayDateStr: string): Date[] {
  const firstPay = new Date(firstPayDateStr + "T00:00:00");
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((monthStart.getTime() - firstPay.getTime()) / msPerDay);
  let intervalsNeeded = Math.floor(daysDiff / 14);
  if (intervalsNeeded < 0) intervalsNeeded = 0;

  const results: Date[] = [];
  for (let i = Math.max(0, intervalsNeeded - 1); ; i++) {
    const payDate = new Date(firstPay.getTime() + i * 14 * msPerDay);
    if (payDate > monthEnd) break;
    if (payDate >= monthStart) results.push(payDate);
  }
  return results;
}

function getBimonthlyDatesInMonth(year: number, month: number): Date[] {
  const lastDay = new Date(year, month, 0).getDate();
  return [new Date(year, month - 1, 15), new Date(year, month - 1, lastDay)];
}

export function calculatePaychecksForMonth(
  year: number,
  month: number,
  settings: Partial<PaycheckSettings> = {}
): Paycheck[] {
  const s: PaycheckSettings = { ...DEFAULT_SETTINGS, ...settings };
  const paychecks: Paycheck[] = [];

  const wifeNet = s.wifeNetPaycheck ?? (s.wifeSalaryGross / 26) * (1 - s.taxRate);
  for (const date of getBiweeklyDatesInMonth(year, month, s.wifeFirstPayDate)) {
    paychecks.push({
      date,
      amount: Math.round(wifeNet * 100) / 100,
      source: "WIFE_SALARY",
      label: `Wife Salary — ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }

  const job1Net = s.job1NetPaycheck ?? (s.job1SalaryGross / 26) * (1 - s.taxRate);
  for (const date of getBiweeklyDatesInMonth(year, month, s.job1FirstPayDate)) {
    paychecks.push({
      date,
      amount: Math.round(job1Net * 100) / 100,
      source: "JOB1_SALARY",
      label: `Job 1 Salary — ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }

  const job2Net = s.job2NetPaycheck ?? (s.job2SalaryGross / 24) * (1 - s.taxRate);
  for (const date of getBimonthlyDatesInMonth(year, month)) {
    paychecks.push({
      date,
      amount: Math.round(job2Net * 100) / 100,
      source: "JOB2_SALARY",
      label: `Job 2 Salary — ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }

  return paychecks;
}
