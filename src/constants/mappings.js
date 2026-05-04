export const DISCOVERY_MAPPINGS = {
  "checkers":       "Food & Groceries",
  "woolworths":     "Food & Groceries",
  "pick n pay":     "Food & Groceries",
  "pnp":            "Food & Groceries",
  "spar":           "Food & Groceries",
  "shoprite":       "Food & Groceries",
  "uber eats":      "Food & Groceries",
  "mr d":           "Food & Groceries",
  "uber":           "Transport",
  "bolt":           "Transport",
  "engen":          "Transport",
  "sasol":          "Transport",
  "shell":          "Transport",
  "bp ":            "Transport",
  "gautrain":       "Transport",
  "netflix":        "Subscriptions",
  "spotify":        "Subscriptions",
  "dstv":           "Subscriptions",
  "showmax":        "Subscriptions",
  "amazon prime":   "Subscriptions",
  "apple":          "Subscriptions",
  "discovery life": "Medical Aid",
  "discovery health":"Medical Aid",
  "vitality":       "Medical Aid",
  "clicks":         "Medical Aid",
  "dis-chem":       "Medical Aid",
  "municipality":   "Utilities",
  "eskom":          "Utilities",
  "city power":     "Utilities",
  "vodacom":        "Utilities",
  "mtn":            "Utilities",
  "telkom":         "Utilities",
  "rain":           "Utilities",
  "edgars":         "Clothing",
  "mr price":       "Clothing",
  "h&m":            "Clothing",
  "zara":           "Clothing",
  "cotton on":      "Clothing",
  "ster kinekor":   "Entertainment",
  "nu metro":       "Entertainment",
  "computicket":    "Entertainment",
  "takealot":       "Entertainment",
};

export function mapToCategory(description) {
  const lower = description.toLowerCase();
  for (const [key, cat] of Object.entries(DISCOVERY_MAPPINGS)) {
    if (lower.includes(key)) return cat;
  }
  return "Entertainment";
}
