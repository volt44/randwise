export async function parseBankStatement(base64PDF) {
  const system = `You are a bank statement parser for Discovery Bank South Africa.
Extract ALL debit transactions from the statement.
Return ONLY valid JSON, no markdown, no explanation.
Format: {"transactions":[{"date":"YYYY-MM-DD","description":"merchant name","amount":123.45},...]}
Rules:
- amount is always positive (debit amount spent)
- Skip credits, transfers in, salary deposits
- Skip Discovery Miles redemptions (those are not cash)
- date must be ISO format
- description should be clean merchant name only`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64PDF } },
          { type: "text", text: "Extract all debit transactions from this Discovery Bank statement as JSON." },
        ],
      }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "{}";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { transactions: [] };
  }
}
