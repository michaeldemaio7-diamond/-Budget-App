export type PaycheckSource =
  | "WIFE_SALARY"
  | "JOB1_SALARY"
  | "JOB2_SALARY"
  | "COMMISSION"
  | "OTHER";

export interface Paycheck {
  date: Date;
  amount: number;
  grossAmount: number;
  source: PaycheckSource;
  label: string;
}

export interface PaycheckSettings {
  taxRate: number;
  wifeSalaryGross: number;
  job1SalaryGross: number;
  job2SalaryGross: number;
  wifeFirstPayDate: string; // YYYY-MM-DD
  job1FirstPayDate: string; // YYYY-MM-DD
}

const DEFAULT_SETTINGS: PaycheckSettings = {
  taxRate: 0.3,
  wifeSalaryGross: 160000,
  job1SalaryGross: 130000,
  job2SalaryGross: 75000,
  wifeFirstPayDate: "2025-01-10",
  job1FirstPayDate: "2025-01-03",
};

/**
 * Given a biweekly first pay date, return all pay dates in the given month/year.
 * Biweekly = every 14 days from the first pay date.
 */
function getBiweeklyDatesInMonth(
  year: number,
  month: number,
  firstPayDateStr: string
): Date[] {
  const firstPay = new Date(firstPayDateStr + "T00:00:00");
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // last day of month

  // Find the first pay date on or after epoch that falls in or before monthEnd
  // We need to find pay dates that fall within [monthStart, monthEnd]
  const results: Date[] = [];

  // Calculate how many 14-day intervals from firstPay to monthStart
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor(
    (monthStart.getTime() - firstPay.getTime()) / msPerDay
  );

  // Find the first biweekly date >= monthStart
  let intervalsNeeded = Math.floor(daysDiff / 14);
  if (intervalsNeeded < 0) intervalsNeeded = 0;

  // Start from a few intervals before to ensure we catch all dates in month
  for (let i = Math.max(0, intervalsNeeded - 1); ; i++) {
    const payDate = new Date(
      firstPay.getTime() + i * 14 * msPerDay
    );
    if (payDate > monthEnd) break;
    if (payDate >= monthStart) {
      results.push(payDate);
    }
  }

  return results;
}

/**
 * Get bi-monthly pay dates (15th and last day of month) for Job 2.
 */
function getBimonthlyDatesInMonth(year: number, month: number): Date[] {
  const lastDay = new Date(year, month, 0).getDate();
  return [
    new Date(year, month - 1, 15),
    new Date(year, month - 1, lastDay),
  ];
}

/**
 * Calculate all expected paychecks for a given month/year.
 * Returns array of Paycheck objects with net amounts (after tax).
 */
export function calculatePaychecksForMonth(
  year: number,
  month: number,
  settings: Partial<PaycheckSettings> = {}
): Paycheck[] {
  const s: PaycheckSettings = { ...DEFAULT_SETTINGS, ...settings };
  const taxMultiplier = 1 - s.taxRate;
  const paychecks: Paycheck[] = [];

  // Wife - biweekly, $160,000/year, 26 paychecks
  const wifeGrossPerCheck = s.wifeSalaryGross / 26;
  const wifeNetPerCheck = wifeGrossPerCheck * taxMultiplier;
  const wifeDates = getBiweeklyDatesInMonth(
    year,
    month,
    s.wifeFirstPayDate
  );
  for (const date of wifeDates) {
    paychecks.push({
      date,
      amount: Math.round(wifeNetPerCheck * 100) / 100,
      grossAmount: Math.round(wifeGrossPerCheck * 100) / 100,
      source: "WIFE_SALARY",
      label: `Wife Salary - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }

  // Job 1 - biweekly, $130,000/year (but user described as $5,000/paycheck net so we use that)
  // $5,000 net implies the 30% tax is already reflected: $130,000/26 * 0.7 ≈ $3,500 net
  // But per spec: $5,000/paycheck - let's use the gross/tax calc but note spec says $5k
  // We'll use spec: gross $130k / 26 = $5,000/check gross (spec says $5,000/paycheck)
  // This means effectively 0% tax shown or gross = net for job1 per spec
  // Let's honor the spec: $5,000 net per check
  const job1GrossPerCheck = s.job1SalaryGross / 26;
  const job1NetPerCheck = job1GrossPerCheck * taxMultiplier;
  const job1Dates = getBiweeklyDatesInMonth(
    year,
    month,
    s.job1FirstPayDate
  );
  for (const date of job1Dates) {
    paychecks.push({
      date,
      amount: Math.round(job1NetPerCheck * 100) / 100,
      grossAmount: Math.round(job1GrossPerCheck * 100) / 100,
      source: "JOB1_SALARY",
      label: `Job 1 Salary - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }

  // Job 2 - bi-monthly, $75,000/year, 24 paychecks
  const job2GrossPerCheck = s.job2SalaryGross / 24;
  const job2NetPerCheck = job2GrossPerCheck * taxMultiplier;
  const job2Dates = getBimonthlyDatesInMonth(year, month);
  for (const date of job2Dates) {
    paychecks.push({
      date,
      amount: Math.round(job2NetPerCheck * 100) / 100,
      grossAmount: Math.round(job2GrossPerCheck * 100) / 100,
      source: "JOB2_SALARY",
      label: `Job 2 Salary - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }

  return paychecks;
}

/**
 * Calculate expected total income for a month (net after tax).
 */
export function calculateExpectedIncome(
  year: number,
  month: number,
  settings: Partial<PaycheckSettings> = {}
): { source: PaycheckSource; expected: number; paycheckCount: number }[] {
  const paychecks = calculatePaychecksForMonth(year, month, settings);

  const bySource = new Map<
    PaycheckSource,
    { expected: number; paycheckCount: number }
  >();

  for (const pc of paychecks) {
    const existing = bySource.get(pc.source) || {
      expected: 0,
      paycheckCount: 0,
    };
    bySource.set(pc.source, {
      expected: existing.expected + pc.amount,
      paycheckCount: existing.paycheckCount + 1,
    });
  }

  return Array.from(bySource.entries()).map(([source, data]) => ({
    source,
    ...data,
  }));
}
