export const fmt = (n) => `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
export const pct = (a, b) => b === 0 ? 0 : Math.round((a / b) * 100);
