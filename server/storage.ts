import { 
  Account, 
  InsertAccount, 
  Transaction, 
  InsertTransaction, 
  Category, 
  InsertCategory, 
  Insight, 
  InsertInsight,
  PlaidItem,
  InsertPlaidItem
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Transaction operations
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByAccount(accountId: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  deleteTransaction(id: number): Promise<boolean>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Insight operations
  getInsights(): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  
  // Plaid operations
  getPlaidItems(): Promise<PlaidItem[]>;
  getPlaidItem(id: number): Promise<PlaidItem | undefined>;
  getPlaidItemByItemId(itemId: string): Promise<PlaidItem | undefined>;
  createPlaidItem(item: InsertPlaidItem): Promise<PlaidItem>;
  updatePlaidItem(id: number, updates: Partial<InsertPlaidItem>): Promise<PlaidItem | undefined>;
  deletePlaidItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private categories: Map<number, Category>;
  private insights: Map<number, Insight>;
  private plaidItems: Map<number, PlaidItem>;
  
  private accountId: number = 1;
  private transactionId: number = 1;
  private categoryId: number = 1;
  private insightId: number = 1;
  private plaidItemId: number = 1;

  constructor() {
    this.accounts = new Map();
    this.transactions = new Map();
    this.categories = new Map();
    this.insights = new Map();
    this.plaidItems = new Map();

    // Initialize with default categories
    this.initializeCategories();
    // Initialize with sample insights
    this.initializeInsights();
  }

  private initializeCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: "Housing", color: "#2196F3" },
      { name: "Food", color: "#4CAF50" },
      { name: "Transportation", color: "#FFC107" },
      { name: "Shopping", color: "#F44336" },
      { name: "Utilities", color: "#9C27B0" },
      { name: "Healthcare", color: "#009688" },
      { name: "Entertainment", color: "#FF9800" },
      { name: "Travel", color: "#795548" },
      { name: "Education", color: "#607D8B" },
      { name: "Income", color: "#8BC34A" },
      { name: "Other", color: "#78909C" }
    ];

    for (const category of defaultCategories) {
      this.createCategory(category);
    }
  }

  private initializeInsights() {
    const defaultInsights: InsertInsight[] = [
      {
        title: "Subscription Overlap Detected",
        description: "You have multiple streaming subscriptions (Netflix, Hulu, Disney+). Consider consolidating to save $14/month.",
        savingsAmount: 14.00,
        type: "subscription",
        actionLink: "/insights/subscriptions",
      },
      {
        title: "High-Yield Savings Opportunity",
        description: "Moving your savings to an online bank could earn you an extra $420/year in interest.",
        savingsAmount: 420.00,
        type: "high-yield",
        actionLink: "/insights/savings",
      },
      {
        title: "Dining Out Spending Increased",
        description: "Your restaurant spending is up 24% from last month. Setting a budget could save you $150/month.",
        savingsAmount: 150.00,
        type: "spending-alert",
        actionLink: "/budgets/new",
      }
    ];

    for (const insight of defaultInsights) {
      this.createInsight(insight);
    }
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountId++;
    const newAccount: Account = { 
      ...account, 
      id, 
      lastUpdated: new Date(),
      plaidItemId: account.plaidItemId || null,
      plaidAccountId: account.plaidAccountId || null,
      isPlaidConnected: account.isPlaidConnected || null
    };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: number, accountUpdate: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...accountUpdate, lastUpdated: new Date() };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Transaction operations
  async getTransactions(limit?: number): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return limit ? transactions.slice(0, limit) : transactions;
  }

  async getTransactionsByAccount(accountId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const newTransaction: Transaction = { 
      ...transaction, 
      id,
      plaidTransactionId: transaction.plaidTransactionId || null,
      pending: transaction.pending || null,
      pendingTransactionId: transaction.pendingTransactionId || null,
      transactionType: transaction.transactionType || null,
      paymentChannel: transaction.paymentChannel || null,
      isPlaidTransaction: transaction.isPlaidTransaction || null
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]> {
    const createdTransactions: Transaction[] = [];
    for (const transaction of transactions) {
      const newTransaction = await this.createTransaction(transaction);
      createdTransactions.push(newTransaction);
    }
    return createdTransactions;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Insight operations
  async getInsights(): Promise<Insight[]> {
    return Array.from(this.insights.values());
  }

  async createInsight(insight: InsertInsight): Promise<Insight> {
    const id = this.insightId++;
    const newInsight: Insight = { 
      ...insight, 
      id, 
      createdAt: new Date(),
      savingsAmount: insight.savingsAmount || null,
      actionLink: insight.actionLink || null
    };
    this.insights.set(id, newInsight);
    return newInsight;
  }

  // Plaid operations
  async getPlaidItems(): Promise<PlaidItem[]> {
    return Array.from(this.plaidItems.values());
  }

  async getPlaidItem(id: number): Promise<PlaidItem | undefined> {
    return this.plaidItems.get(id);
  }

  async getPlaidItemByItemId(itemId: string): Promise<PlaidItem | undefined> {
    return Array.from(this.plaidItems.values()).find(item => item.itemId === itemId);
  }

  async createPlaidItem(item: InsertPlaidItem): Promise<PlaidItem> {
    const id = this.plaidItemId++;
    const newItem: PlaidItem = { 
      ...item, 
      id, 
      lastUpdated: new Date(),
      status: item.status || "active",
      institutionId: item.institutionId || null,
      consentExpiresAt: item.consentExpiresAt || null
    };
    this.plaidItems.set(id, newItem);
    return newItem;
  }

  async updatePlaidItem(id: number, updates: Partial<InsertPlaidItem>): Promise<PlaidItem | undefined> {
    const item = this.plaidItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...updates, lastUpdated: new Date() };
    this.plaidItems.set(id, updatedItem);
    return updatedItem;
  }

  async deletePlaidItem(id: number): Promise<boolean> {
    return this.plaidItems.delete(id);
  }
}

export const storage = new MemStorage();
