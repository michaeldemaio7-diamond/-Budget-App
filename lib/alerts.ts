/**
 * Alert sending stubs.
 *
 * To implement real alerts:
 * - Email: Use nodemailer or a service like SendGrid/Resend
 *   npm install nodemailer @types/nodemailer
 *   or: npm install resend
 * - SMS: Use Twilio
 *   npm install twilio
 */

export interface AlertPayload {
  budgetRowId: number;
  rowLabel: string;
  categoryName: string;
  budgetAmount: number;
  actualAmount: number;
  percentUsed: number;
  alertEmail?: string | null;
  alertPhone?: string | null;
}

/**
 * Send an email alert when a budget row is near/over its limit.
 * TODO: Implement with a real email service.
 */
export async function sendEmailAlert(payload: AlertPayload): Promise<boolean> {
  const { rowLabel, categoryName, budgetAmount, actualAmount, percentUsed, alertEmail } = payload;

  if (!alertEmail) {
    console.warn("No alert email configured, skipping email alert");
    return false;
  }

  const subject = `Budget Alert: ${categoryName} - ${rowLabel} at ${percentUsed.toFixed(0)}%`;
  const message = `
Budget Alert

Your budget for ${categoryName} > ${rowLabel} has reached ${percentUsed.toFixed(1)}%.

  Budgeted: $${budgetAmount.toFixed(2)}
  Spent:    $${actualAmount.toFixed(2)}
  Remaining: $${(budgetAmount - actualAmount).toFixed(2)}

Log in to review your budget: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
  `.trim();

  // TODO: Replace with actual email sending
  // Option 1: Using Resend
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'budget-app@yourdomain.com',
  //   to: alertEmail,
  //   subject,
  //   text: message,
  // });

  // Option 2: Using nodemailer with Gmail SMTP
  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  // });
  // await transporter.sendMail({ from: process.env.SMTP_USER, to: alertEmail, subject, text: message });

  console.log(`[EMAIL ALERT STUB] To: ${alertEmail}\nSubject: ${subject}\n${message}`);
  return true;
}

/**
 * Send an SMS alert when a budget row is near/over its limit.
 * TODO: Implement with Twilio.
 */
export async function sendSmsAlert(payload: AlertPayload): Promise<boolean> {
  const { rowLabel, categoryName, percentUsed, budgetAmount, actualAmount, alertPhone } = payload;

  if (!alertPhone) {
    console.warn("No alert phone configured, skipping SMS alert");
    return false;
  }

  const message = `Budget Alert: ${categoryName} - ${rowLabel} is at ${percentUsed.toFixed(0)}% ($${actualAmount.toFixed(0)} / $${budgetAmount.toFixed(0)})`;

  // TODO: Replace with actual SMS sending via Twilio
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: alertPhone,
  // });

  console.log(`[SMS ALERT STUB] To: ${alertPhone}\n${message}`);
  return true;
}

/**
 * Check a budget row and send alerts if it has crossed the threshold.
 */
export async function checkAndSendAlert(payload: AlertPayload): Promise<{
  emailSent: boolean;
  smsSent: boolean;
}> {
  const emailSent = payload.alertEmail
    ? await sendEmailAlert(payload)
    : false;
  const smsSent = payload.alertPhone
    ? await sendSmsAlert(payload)
    : false;
  return { emailSent, smsSent };
}
