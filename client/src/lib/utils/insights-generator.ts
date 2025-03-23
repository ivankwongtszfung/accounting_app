import { Transaction, Account, InsertInsight } from "@shared/schema";

/**
 * Types of insights the generator can produce
 */
export enum InsightType {
  SUBSCRIPTION_OVERLAP = "subscription",
  HIGH_YIELD_SAVINGS = "high-yield",
  SPENDING_ALERT = "spending-alert"
}

/**
 * Function to generate savings insights based on transaction data
 * 
 * @param transactions Array of transactions to analyze
 * @param accounts Array of accounts to analyze
 * @returns Array of insight objects
 */
export function generateInsights(
  transactions: Transaction[],
  accounts: Account[]
): InsertInsight[] {
  const insights: InsertInsight[] = [];
  
  // Only generate insights if we have enough data
  if (!transactions.length || !accounts.length) {
    return insights;
  }
  
  // Subscription overlap insights
  const subscriptionInsights = findSubscriptionOverlaps(transactions);
  insights.push(...subscriptionInsights);
  
  // High-yield savings insights
  const savingsInsights = findHighYieldSavingsOpportunities(accounts);
  insights.push(...savingsInsights);
  
  // Spending alerts for categories with significant increases
  const spendingAlerts = findSpendingIncreases(transactions);
  insights.push(...spendingAlerts);
  
  return insights;
}

/**
 * Find potential overlapping subscriptions (like multiple streaming services)
 */
function findSubscriptionOverlaps(transactions: Transaction[]): InsertInsight[] {
  const insights: InsertInsight[] = [];
  const subscriptionKeywords = [
    'netflix', 'hulu', 'disney+', 'hbo', 'spotify', 'apple music', 
    'youtube', 'amazon prime', 'paramount', 'peacock'
  ];
  
  const streamingServices = new Set<string>();
  const subscriptionTransactions: { service: string, amount: number }[] = [];
  
  // Find transactions that match subscription keywords
  transactions.forEach(transaction => {
    const description = transaction.description.toLowerCase();
    const merchant = transaction.merchant.toLowerCase();
    const text = `${description} ${merchant}`;
    
    for (const keyword of subscriptionKeywords) {
      if (text.includes(keyword)) {
        streamingServices.add(keyword);
        subscriptionTransactions.push({
          service: keyword,
          amount: Math.abs(Number(transaction.amount))
        });
        break;
      }
    }
  });
  
  // If multiple streaming subscriptions found, generate insight
  if (streamingServices.size >= 3) {
    const services = Array.from(streamingServices).slice(0, 3);
    const totalAmount = subscriptionTransactions.reduce((sum, sub) => sum + sub.amount, 0);
    const monthlySavings = Math.round(totalAmount * 0.4); // Assume 40% savings from consolidation
    
    insights.push({
      title: "Subscription Overlap Detected",
      description: `You have multiple streaming subscriptions (${services.join(', ')}). Consider consolidating to save $${monthlySavings}/month.`,
      savingsAmount: monthlySavings,
      type: InsightType.SUBSCRIPTION_OVERLAP,
      actionLink: "/insights/subscriptions",
    });
  }
  
  return insights;
}

/**
 * Identify savings accounts that could benefit from higher interest rates
 */
function findHighYieldSavingsOpportunities(accounts: Account[]): InsertInsight[] {
  const insights: InsertInsight[] = [];
  
  // Find savings accounts with significant balances
  const savingsAccounts = accounts.filter(account => 
    account.type.toLowerCase() === 'savings' && Number(account.balance) > 1000
  );
  
  if (savingsAccounts.length > 0) {
    // Calculate potential interest gain using a 3% higher yield
    const totalSavings = savingsAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
    const currentEstimatedRate = 0.01; // Assume 0.01% current rate
    const highYieldRate = 0.035; // Assume 3.5% high-yield rate
    
    const currentYearlyInterest = totalSavings * currentEstimatedRate;
    const potentialYearlyInterest = totalSavings * highYieldRate;
    const additionalInterest = Math.round(potentialYearlyInterest - currentYearlyInterest);
    
    if (additionalInterest > 20) { // Only show if savings are significant
      insights.push({
        title: "High-Yield Savings Opportunity",
        description: `Moving your savings to an online bank could earn you an extra $${additionalInterest}/year in interest.`,
        savingsAmount: additionalInterest,
        type: InsightType.HIGH_YIELD_SAVINGS,
        actionLink: "/insights/savings",
      });
    }
  }
  
  return insights;
}

/**
 * Find categories with significant spending increases
 */
function findSpendingIncreases(transactions: Transaction[]): InsertInsight[] {
  const insights: InsertInsight[] = [];
  
  // Group transactions by month and category
  const spendingByMonthAndCategory: Record<string, Record<string, number>> = {};
  
  transactions.forEach(transaction => {
    const amount = Number(transaction.amount);
    if (amount >= 0) return; // Skip income transactions
    
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
    const category = transaction.category;
    
    if (!spendingByMonthAndCategory[monthYear]) {
      spendingByMonthAndCategory[monthYear] = {};
    }
    
    if (!spendingByMonthAndCategory[monthYear][category]) {
      spendingByMonthAndCategory[monthYear][category] = 0;
    }
    
    spendingByMonthAndCategory[monthYear][category] += Math.abs(amount);
  });
  
  // Get months in chronological order
  const months = Object.keys(spendingByMonthAndCategory).sort();
  
  // Need at least two months of data
  if (months.length < 2) return insights;
  
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  
  // Compare current month to previous month for each category
  const currentMonthData = spendingByMonthAndCategory[currentMonth];
  const previousMonthData = spendingByMonthAndCategory[previousMonth];
  
  Object.entries(currentMonthData).forEach(([category, amount]) => {
    const previousAmount = previousMonthData[category] || 0;
    
    // Calculate increase percentage
    if (previousAmount > 50) { // Only if previous spending was significant
      const increasePercent = Math.round(((amount - previousAmount) / previousAmount) * 100);
      const absoluteIncrease = Math.round(amount - previousAmount);
      
      // If spending increased by at least 20% and $50
      if (increasePercent >= 20 && absoluteIncrease >= 50) {
        // Exclude some categories like "Income"
        if (category !== "Income" && category !== "Other") {
          const potentialSavings = Math.round(absoluteIncrease * 0.7); // 70% of the increase
          
          insights.push({
            title: `${category} Spending Increased`,
            description: `Your ${category.toLowerCase()} spending is up ${increasePercent}% from last month. Setting a budget could save you $${potentialSavings}/month.`,
            savingsAmount: potentialSavings,
            type: InsightType.SPENDING_ALERT,
            actionLink: "/budgets/new",
          });
        }
      }
    }
  });
  
  // Limit to top 3 insights by savings amount
  return insights
    .sort((a, b) => Number(b.savingsAmount) - Number(a.savingsAmount))
    .slice(0, 3);
}

/**
 * Analyze recurring transactions like bills and subscriptions
 */
export function findRecurringTransactions(
  transactions: Transaction[],
  timeframeMonths: number = 3
): { merchant: string; category: string; averageAmount: number; frequency: string }[] {
  const recurringItems: Record<string, { 
    dates: Date[]; 
    amounts: number[];
    category: string;
  }> = {};
  
  // Look for potential recurring transactions
  transactions.forEach(transaction => {
    if (Number(transaction.amount) >= 0) return; // Skip income transactions
    
    const merchant = transaction.merchant.toLowerCase();
    const amount = Math.abs(Number(transaction.amount));
    const date = new Date(transaction.date);
    
    // Skip very small transactions
    if (amount < 5) return;
    
    if (!recurringItems[merchant]) {
      recurringItems[merchant] = {
        dates: [],
        amounts: [],
        category: transaction.category
      };
    }
    
    recurringItems[merchant].dates.push(date);
    recurringItems[merchant].amounts.push(amount);
  });
  
  const recurring: { 
    merchant: string; 
    category: string; 
    averageAmount: number; 
    frequency: string 
  }[] = [];
  
  // Analyze each merchant for recurring patterns
  Object.entries(recurringItems).forEach(([merchant, data]) => {
    // Need at least 2 transactions to detect patterns
    if (data.dates.length < 2) return;
    
    // Sort dates chronologically
    data.dates.sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate average days between transactions
    let totalDaysBetween = 0;
    for (let i = 1; i < data.dates.length; i++) {
      const daysDiff = Math.round((data.dates[i].getTime() - data.dates[i-1].getTime()) / (1000 * 60 * 60 * 24));
      totalDaysBetween += daysDiff;
    }
    
    const avgDaysBetween = totalDaysBetween / (data.dates.length - 1);
    
    // Determine frequency
    let frequency = "unknown";
    if (avgDaysBetween >= 25 && avgDaysBetween <= 35) {
      frequency = "monthly";
    } else if (avgDaysBetween >= 6 && avgDaysBetween <= 8) {
      frequency = "weekly";
    } else if (avgDaysBetween >= 13 && avgDaysBetween <= 16) {
      frequency = "bi-weekly";
    } else if (avgDaysBetween >= 85 && avgDaysBetween <= 95) {
      frequency = "quarterly";
    } else {
      return; // Skip if frequency is unclear
    }
    
    // Calculate average amount
    const avgAmount = data.amounts.reduce((sum, amount) => sum + amount, 0) / data.amounts.length;
    
    recurring.push({
      merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1), // Capitalize first letter
      category: data.category,
      averageAmount: Math.round(avgAmount * 100) / 100,
      frequency
    });
  });
  
  return recurring.sort((a, b) => b.averageAmount - a.averageAmount);
}
