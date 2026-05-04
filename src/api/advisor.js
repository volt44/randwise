export async function askAdvisor(messages, ctx) {
  const system = `You are a sharp, friendly personal financial advisor for a user in Cape Town, South Africa.
Speak in ZAR. Know SA products: TFSA (R36k limit), RAs, Capitec, TymeBank, Allan Gray, Easy Equities, Discovery Bank.
Keep responses concise (3-5 sentences unless asked for detail). Be direct and practical.
Current snapshot:\n${ctx}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "No response.";
}
