import { google } from "googleapis";

export interface ParsedTransaction {
  merchant: string;
  amount: number;
  date: Date;
  rawEmailId: string;
  description: string;
}

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function generateAuthUrl(accountNumber: 1 | 2, loginHint?: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    login_hint: loginHint,
    state: String(accountNumber),
  });
}

export async function exchangeOAuthCode(
  code: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("OAuth token exchange did not return expected tokens. Make sure access_type=offline and prompt=consent.");
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };
}

export async function syncChaseEmails(
  refreshToken: string,
  sinceDate: Date
): Promise<ParsedTransaction[]> {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000);
  // Catches Chase Freedom, Sapphire, and all other Chase card notifications
  const query = `from:no.reply.alerts@chase.com (subject:transaction OR subject:charged) after:${sinceTimestamp}`;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 100,
  });

  const messages = listRes.data.messages || [];
  const transactions: ParsedTransaction[] = [];

  for (const msg of messages) {
    if (!msg.id) continue;
    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "metadata",
      metadataHeaders: ["Subject", "Date"],
    });

    const parsed = parseChaseEmailMessage(full.data);
    if (parsed) {
      transactions.push({ ...parsed, rawEmailId: msg.id });
    }
  }

  return transactions;
}

export function parseChaseEmailMessage(emailData: {
  id?: string | null;
  payload?: {
    headers?: Array<{ name?: string | null; value?: string | null }> | null;
  } | null;
}): Omit<ParsedTransaction, "rawEmailId"> | null {
  const headers = emailData.payload?.headers || [];
  const subject = headers.find((h) => h.name === "Subject")?.value || "";
  const dateHeader = headers.find((h) => h.name === "Date")?.value || "";
  return parseChaseEmailSubject(subject, dateHeader);
}

export function parseChaseEmailSubject(
  subject: string,
  dateStr?: string
): Omit<ParsedTransaction, "rawEmailId"> | null {
  // "Your $127.43 transaction at Whole Foods Market"
  const pattern1 = /Your \$([\d,]+\.?\d*) transaction (?:at|with) (.+)/i;
  // "A new transaction of $42.50 was charged to your Chase card ending in 1234 at MERCHANT"
  const pattern2 = /transaction of \$([\d,]+\.?\d*) was charged.*?(?:\bat (.+))?$/i;
  // Fallback: any dollar amount in subject
  const pattern3 = /\$([\d,]+\.?\d*)/;

  let amount: number | null = null;
  let merchant = "Chase Card Transaction";

  const m1 = subject.match(pattern1);
  const m2 = subject.match(pattern2);

  if (m1) {
    amount = parseFloat(m1[1].replace(/,/g, ""));
    merchant = m1[2].trim();
  } else if (m2) {
    amount = parseFloat(m2[1].replace(/,/g, ""));
    if (m2[2]) merchant = m2[2].trim();
  } else {
    const m3 = subject.match(pattern3);
    if (m3) amount = parseFloat(m3[1].replace(/,/g, ""));
  }

  if (amount === null || amount <= 0) return null;

  const date = dateStr ? new Date(dateStr) : new Date();

  return {
    merchant,
    amount,
    date: isNaN(date.getTime()) ? new Date() : date,
    description: subject,
  };
}
