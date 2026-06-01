import Anthropic from "@anthropic-ai/sdk";

export interface BudgetRowOption {
  id: number;
  label: string;
  categoryName: string;
}

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function categorizeMerchant(
  merchant: string,
  amount: number,
  description: string,
  availableRows: BudgetRowOption[]
): Promise<number | null> {
  const ai = getClient();
  if (!ai) return null; // No API key — caller will fall back to Miscellaneous

  const rowList = availableRows
    .map((r) => `  ID ${r.id}: ${r.categoryName} → ${r.label}`)
    .join("\n");

  const prompt = `You are a personal finance assistant. Given a credit card transaction, pick the single best budget category from the list below.

Transaction:
  Merchant: ${merchant}
  Amount: $${amount.toFixed(2)}
  Description: ${description || merchant}

Available budget rows:
${rowList}

Reply with ONLY the numeric ID of the best matching row. If you genuinely cannot determine a reasonable match, reply with the word "misc". No explanation, no punctuation — just the number or "misc".`;

  try {
    const message = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { text: string }).text.trim().toLowerCase();
    if (text === "misc") return null;

    const id = parseInt(text);
    if (!isNaN(id) && availableRows.some((r) => r.id === id)) return id;
    return null;
  } catch (err) {
    console.error("[categorize] Claude API error:", err);
    return null;
  }
}
