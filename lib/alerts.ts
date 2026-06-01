import nodemailer from "nodemailer";

export interface AlertPayload {
  budgetRowId: number;
  rowLabel: string;
  categoryName: string;
  budgetAmount: number;
  actualAmount: number;
  percentUsed: number;
  alertEmail?: string | null;
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmailAlert(payload: AlertPayload): Promise<boolean> {
  const { rowLabel, categoryName, budgetAmount, actualAmount, percentUsed, alertEmail } = payload;

  if (!alertEmail) return false;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[alerts] SMTP_USER or SMTP_PASS not set — skipping email alert");
    return false;
  }

  const remaining = budgetAmount - actualAmount;
  const isOver = actualAmount > budgetAmount;
  const subject = isOver
    ? `🚨 Budget Exceeded: ${categoryName} — ${rowLabel}`
    : `⚠️ Budget Alert: ${categoryName} — ${rowLabel} at ${percentUsed.toFixed(0)}%`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: ${isOver ? "#dc2626" : "#d97706"}; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">${isOver ? "🚨 Budget Exceeded" : "⚠️ Budget Alert"}</h2>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 16px;">
          <strong>${categoryName} › ${rowLabel}</strong> has reached <strong>${percentUsed.toFixed(1)}%</strong> of its budget.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Budgeted</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">$${budgetAmount.toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Spent</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${isOver ? "#dc2626" : "#334155"};">$${actualAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Remaining</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${remaining < 0 ? "#dc2626" : "#16a34a"};">${remaining < 0 ? "-" : ""}$${Math.abs(remaining).toFixed(2)}</td>
          </tr>
        </table>
        <div style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}"
             style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">
            View Budget
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `Budget App <${process.env.SMTP_USER}>`,
      to: alertEmail,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[alerts] Failed to send email:", err);
    return false;
  }
}

export async function checkAndSendAlert(payload: AlertPayload): Promise<{ emailSent: boolean }> {
  const emailSent = await sendEmailAlert(payload);
  return { emailSent };
}
