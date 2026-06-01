import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndSendAlert } from "@/lib/alerts";

/**
 * POST /api/alerts/check
 *
 * Check all budget rows for the given month and send alerts for those
 * that have exceeded their alert threshold.
 *
 * Body: { month?: number, year?: number }
 * Defaults to current month/year.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const month = body.month || now.getMonth() + 1;
    const year = body.year || now.getFullYear();

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });

    const budgetMonth = await prisma.budgetMonth.findUnique({
      where: { month_year: { month, year } },
    });

    if (!budgetMonth) {
      return NextResponse.json({ error: "Month not found" }, { status: 404 });
    }

    const rows = await prisma.budgetRow.findMany({
      where: {
        budgetMonthId: budgetMonth.id,
        alertSent: false,
      },
      include: { category: true },
    });

    const alerts: { rowId: number; label: string; percent: number; emailSent: boolean; smsSent: boolean }[] = [];

    for (const row of rows) {
      const budget = parseFloat(row.budgetAmount.toString());
      const actual = parseFloat(row.actualAmount.toString());
      const threshold = parseFloat(row.alertThreshold.toString());

      if (budget <= 0) continue;

      const percentUsed = (actual / budget) * 100;

      if (percentUsed >= threshold) {
        const result = await checkAndSendAlert({
          budgetRowId: row.id,
          rowLabel: row.label,
          categoryName: row.category.name,
          budgetAmount: budget,
          actualAmount: actual,
          percentUsed,
          alertEmail: settings?.alertEmail,
          alertPhone: settings?.alertPhone,
        });

        // Log the alert
        if (result.emailSent) {
          await prisma.alert.create({
            data: {
              budgetRowId: row.id,
              type: "EMAIL",
              message: `Budget alert: ${row.category.name} - ${row.label} at ${percentUsed.toFixed(0)}%`,
            },
          });
        }
        if (result.smsSent) {
          await prisma.alert.create({
            data: {
              budgetRowId: row.id,
              type: "SMS",
              message: `Budget alert: ${row.category.name} - ${row.label} at ${percentUsed.toFixed(0)}%`,
            },
          });
        }

        // Mark as sent if any alert was sent
        if (result.emailSent || result.smsSent) {
          await prisma.budgetRow.update({
            where: { id: row.id },
            data: { alertSent: true },
          });
        }

        alerts.push({
          rowId: row.id,
          label: `${row.category.name} - ${row.label}`,
          percent: Math.round(percentUsed),
          ...result,
        });
      }
    }

    return NextResponse.json({
      success: true,
      alertsChecked: rows.length,
      alertsTriggered: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("POST /api/alerts/check error:", error);
    return NextResponse.json({ error: "Alert check failed" }, { status: 500 });
  }
}
