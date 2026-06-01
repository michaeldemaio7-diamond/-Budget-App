/**
 * Gmail API Integration Stubs
 *
 * To implement Gmail integration you will need:
 * 1. A Google Cloud project with Gmail API enabled
 * 2. OAuth 2.0 credentials (client ID + secret)
 * 3. Scopes: https://www.googleapis.com/auth/gmail.readonly
 * 4. Install: npm install googleapis
 *
 * The OAuth flow:
 * 1. Redirect user to Google consent screen with the scopes above
 * 2. Google redirects back with an authorization code
 * 3. Exchange the code for access + refresh tokens
 * 4. Store refresh token in Settings table (gmailToken1 / gmailToken2)
 * 5. Use refresh token to get new access tokens as needed
 */

export interface ParsedTransaction {
  merchant: string;
  amount: number;
  date: Date;
  rawEmailId: string;
  description: string;
}

/**
 * Connect a Gmail account via OAuth.
 * TODO: Implement OAuth flow
 * - Generate auth URL with: https://accounts.google.com/o/oauth2/auth
 *   params: client_id, redirect_uri, scope=gmail.readonly, response_type=code, access_type=offline
 * - User visits URL, grants permission
 * - Exchange code at: https://oauth2.googleapis.com/token
 * - Store refresh_token in Settings.gmailToken1 or gmailToken2
 */
export async function connectGmailAccount(email: string): Promise<{ authUrl: string }> {
  // TODO: Implement with googleapis package
  // const { google } = require('googleapis');
  // const oauth2Client = new google.auth.OAuth2(
  //   process.env.GOOGLE_CLIENT_ID,
  //   process.env.GOOGLE_CLIENT_SECRET,
  //   process.env.GOOGLE_REDIRECT_URI
  // );
  // const authUrl = oauth2Client.generateAuthUrl({
  //   access_type: 'offline',
  //   scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  //   login_hint: email,
  // });
  // return { authUrl };
  console.log(`connectGmailAccount stub called for ${email}`);
  return { authUrl: "https://accounts.google.com/o/oauth2/auth?TODO=implement" };
}

/**
 * Sync Chase credit card notification emails from a Gmail account.
 *
 * Chase sends emails with subjects like:
 * - "Your $XX.XX transaction at MERCHANT NAME"
 * - "A new transaction of $XX.XX was charged to your Chase card"
 * - "Your $XX.XX transaction with MERCHANT NAME"
 *
 * Search query to use: from:no.reply.alerts@chase.com subject:transaction
 *
 * TODO: Implement with googleapis
 * - Search for emails: gmail.users.messages.list with q param
 * - For each message ID, get full message: gmail.users.messages.get
 * - Parse subject/body to extract transaction details
 * - Store in Transaction table using rawEmailId to avoid duplicates
 */
export async function syncChaseEmails(
  email: string,
  refreshToken: string,
  sinceDate: Date
): Promise<ParsedTransaction[]> {
  // TODO: Implement
  // const { google } = require('googleapis');
  // const oauth2Client = new google.auth.OAuth2(...);
  // oauth2Client.setCredentials({ refresh_token: refreshToken });
  // const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  //
  // const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000);
  // const query = `from:no.reply.alerts@chase.com after:${sinceTimestamp}`;
  //
  // const response = await gmail.users.messages.list({
  //   userId: 'me',
  //   q: query,
  //   maxResults: 100,
  // });
  //
  // const transactions: ParsedTransaction[] = [];
  // for (const msg of response.data.messages || []) {
  //   const full = await gmail.users.messages.get({ userId: 'me', id: msg.id });
  //   const parsed = parseChaseEmailMessage(full.data);
  //   if (parsed) transactions.push({ ...parsed, rawEmailId: msg.id });
  // }
  // return transactions;

  console.log(`syncChaseEmails stub called for ${email} since ${sinceDate.toISOString()}`);
  return [];
}

/**
 * Parse a Chase transaction notification email to extract transaction data.
 *
 * Chase email subjects:
 * - "Your $127.43 transaction at Whole Foods Market"
 * - "A new transaction of $42.50 was charged to your Chase card ending in 1234"
 *
 * Chase email body (HTML) contains:
 * - Transaction amount
 * - Merchant name
 * - Date
 * - Card last 4 digits
 *
 * TODO: Implement actual parsing
 */
export function parseChaseEmailMessage(emailData: {
  id?: string | null;
  payload?: {
    headers?: Array<{ name?: string | null; value?: string | null }> | null;
    body?: { data?: string | null } | null;
    parts?: Array<{ body?: { data?: string | null } | null }> | null;
  } | null;
}): Omit<ParsedTransaction, "rawEmailId"> | null {
  const headers = emailData.payload?.headers || [];
  const subject = headers.find((h) => h.name === "Subject")?.value || "";
  const dateHeader = headers.find((h) => h.name === "Date")?.value || "";

  return parseChaseEmailSubject(subject, dateHeader);
}

/**
 * Parse Chase transaction from email subject line.
 * This is the main parsing logic.
 */
export function parseChaseEmailSubject(
  subject: string,
  dateStr?: string
): Omit<ParsedTransaction, "rawEmailId"> | null {
  // Pattern 1: "Your $127.43 transaction at Whole Foods Market"
  const pattern1 = /Your \$([\d,]+\.?\d*) transaction (?:at|with) (.+)/i;
  // Pattern 2: "A new transaction of $42.50 was charged to your Chase card"
  const pattern2 = /A new transaction of \$([\d,]+\.?\d*) was charged to your Chase card(?:\s+ending in \d+)?(?:\s+at (.+))?/i;
  // Pattern 3: "Your $XX.XX transaction"
  const pattern3 = /\$([\d,]+\.?\d*) transaction/i;

  let amount: number | null = null;
  let merchant = "Unknown Merchant";

  const match1 = subject.match(pattern1);
  const match2 = subject.match(pattern2);

  if (match1) {
    amount = parseFloat(match1[1].replace(/,/g, ""));
    merchant = match1[2].trim();
  } else if (match2) {
    amount = parseFloat(match2[1].replace(/,/g, ""));
    merchant = match2[2]?.trim() || "Chase Card Transaction";
  } else {
    const match3 = subject.match(pattern3);
    if (match3) {
      amount = parseFloat(match3[1].replace(/,/g, ""));
    }
  }

  if (amount === null) return null;

  const date = dateStr ? new Date(dateStr) : new Date();

  return {
    merchant,
    amount,
    date: isNaN(date.getTime()) ? new Date() : date,
    description: subject,
  };
}

/**
 * Exchange OAuth authorization code for tokens.
 * TODO: Implement
 */
export async function exchangeOAuthCode(
  code: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // TODO: POST to https://oauth2.googleapis.com/token with:
  // code, client_id, client_secret, redirect_uri, grant_type=authorization_code
  throw new Error("Gmail OAuth not yet implemented. See TODO in lib/gmail.ts");
}
