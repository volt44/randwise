export const avalanche = (d) => [...d].sort((a, b) => b.rate - a.rate);
export const snowball  = (d) => [...d].sort((a, b) => a.balance - b.balance);

export function monthsToPayoff(bal, rate, pay) {
  if (pay <= 0 || bal <= 0) return Infinity;
  const m = rate / 100 / 12;
  if (m === 0) return Math.ceil(bal / pay);
  const n = -Math.log(1 - (m * bal) / pay) / Math.log(1 + m);
  return isFinite(n) ? Math.ceil(n) : Infinity;
}
