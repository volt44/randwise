export const ALLOWED_EMAIL = "johanellis10@gmail.com";

export const TABS = ["dashboard", "budget", "debts", "advisor"];

export const DEFAULT_CATEGORIES = [
  { id:1,  name:"Housing",         budget:9000, spent:9000, color:"#00E5A0", group:"needs"   },
  { id:2,  name:"Food & Groceries",budget:3500, spent:4100, color:"#00C9FF", group:"needs"   },
  { id:3,  name:"Transport",       budget:2000, spent:1750, color:"#7B61FF", group:"needs"   },
  { id:4,  name:"Medical Aid",     budget:1800, spent:1800, color:"#FF6B4A", group:"needs"   },
  { id:5,  name:"Utilities",       budget:1200, spent:980,  color:"#FFB800", group:"needs"   },
  { id:6,  name:"Entertainment",   budget:1500, spent:2100, color:"#FF4A8D", group:"wants"   },
  { id:7,  name:"Clothing",        budget:800,  spent:450,  color:"#A8FF78", group:"wants"   },
  { id:8,  name:"Subscriptions",   budget:600,  spent:890,  color:"#FF9A3C", group:"wants"   },
  { id:9,  name:"Emergency Fund",  budget:2000, spent:2000, color:"#00E5A0", group:"savings" },
  { id:10, name:"TFSA",            budget:3000, spent:1500, color:"#00C9FF", group:"savings" },
];

export const DEFAULT_DEBTS = [
  { id:1, name:"Credit Card",        balance:12500, rate:21.5, minimum:375  },
  { id:2, name:"Woolworths Account", balance:3200,  rate:24.0, minimum:160  },
  { id:3, name:"Personal Loan",      balance:45000, rate:17.5, minimum:1200 },
];
