import { Transaction, InsertTransaction } from "@shared/schema";

// Define ruleset for transaction categorization
type CategoryRule = {
  keywords: string[];
  category: string;
};

// These rules are used to automatically categorize transactions
const categoryRules: CategoryRule[] = [
  {
    keywords: ["rent", "mortgage", "apartment", "home", "property", "loan", "house"],
    category: "Housing"
  },
  {
    keywords: ["market", "grocery", "supermarket", "food", "restaurant", "dining", "cafe", "coffee", "breakfast", "lunch", "dinner", "meal", "doordash", "uber eats", "grubhub", "pizza", "takeout"],
    category: "Food"
  },
  {
    keywords: ["gas", "fuel", "uber", "lyft", "taxi", "car", "auto", "vehicle", "maintenance", "repair", "oil", "tire", "parking", "transport", "transit", "bus", "train", "subway", "metro"],
    category: "Transportation"
  },
  {
    keywords: ["amazon", "walmart", "target", "costco", "shop", "store", "retail", "mall", "outlet", "purchase", "buy", "clothes", "clothing", "apparel", "shoes", "accessory", "electronics", "appliance", "hardware"],
    category: "Shopping"
  },
  {
    keywords: ["electric", "electricity", "gas", "water", "sewer", "trash", "internet", "cable", "phone", "mobile", "cellular", "utility", "bill", "service"],
    category: "Utilities"
  },
  {
    keywords: ["doctor", "hospital", "medical", "health", "healthcare", "dental", "vision", "pharmacy", "prescription", "medicine", "clinic", "emergency", "insurance", "fitness", "gym", "wellness"],
    category: "Healthcare"
  },
  {
    keywords: ["movie", "theatre", "theater", "cinema", "concert", "show", "entertainment", "music", "spotify", "netflix", "hulu", "disney", "streaming", "subscription", "game", "hobby", "fun", "leisure"],
    category: "Entertainment"
  },
  {
    keywords: ["school", "college", "university", "tuition", "education", "course", "class", "degree", "student", "book", "textbook", "study", "learning", "training", "workshop"],
    category: "Education"
  },
  {
    keywords: ["hotel", "motel", "lodging", "airbnb", "vacation", "holiday", "trip", "travel", "flight", "airline", "airplane", "booking", "reservation", "ticket", "tour", "cruise", "resort"],
    category: "Travel"
  },
  {
    keywords: ["salary", "payroll", "deposit", "income", "revenue", "wage", "payment", "compensation", "bonus", "commission", "dividend", "interest", "refund", "return", "reimbursement"],
    category: "Income"
  }
];

/**
 * Categorizes a transaction based on its description and merchant
 * 
 * @param transaction Transaction to categorize
 * @returns Category name
 */
export function categorizeTransaction(transaction: Transaction | InsertTransaction): string {
  const searchText = `${transaction.description} ${transaction.merchant}`.toLowerCase();
  
  // Check if amount is positive (an income)
  if (Number(transaction.amount) > 0) {
    return "Income";
  }
  
  // Try to match transaction to category rules
  for (const rule of categoryRules) {
    if (rule.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      return rule.category;
    }
  }
  
  // Default category if no match found
  return "Other";
}

/**
 * Categorizes a batch of transactions
 * 
 * @param transactions Array of transactions to categorize
 * @returns Array of transactions with categories assigned
 */
export function categorizeBatch(transactions: (Transaction | InsertTransaction)[]): (Transaction | InsertTransaction)[] {
  return transactions.map(transaction => {
    // Only categorize if the transaction doesn't already have a category or category is "Other"
    if (!transaction.category || transaction.category === "Other") {
      return {
        ...transaction,
        category: categorizeTransaction(transaction)
      };
    }
    return transaction;
  });
}

/**
 * Suggests a category for a transaction description
 * 
 * @param description Text to analyze for category suggestion
 * @returns Suggested category name
 */
export function suggestCategory(description: string): string {
  const searchText = description.toLowerCase();
  
  for (const rule of categoryRules) {
    if (rule.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      return rule.category;
    }
  }
  
  return "Other";
}
