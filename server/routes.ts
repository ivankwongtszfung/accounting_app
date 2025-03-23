import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSchema, insertTransactionSchema, insertCategorySchema, insertInsightSchema, insertPlaidItemSchema } from "@shared/schema";
import multer from "multer";
import { Readable } from "stream";
import { parse } from "csv-parse";
import { createLinkToken, exchangePublicToken, fetchAccounts, fetchTransactions } from "./plaid";

// Helper function to categorize transactions based on description
function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  // Dining/Restaurants
  if (lowerDesc.includes('restaurant') || lowerDesc.includes('cafe') || 
      lowerDesc.includes('diner') || lowerDesc.includes('pizza') || 
      lowerDesc.includes('burger') || lowerDesc.includes('food') || 
      lowerDesc.includes('grubhub') || lowerDesc.includes('doordash') || 
      lowerDesc.includes('ubereats')) {
    return 'Dining';
  }
  
  // Transportation
  if (lowerDesc.includes('uber') || lowerDesc.includes('lyft') || 
      lowerDesc.includes('taxi') || lowerDesc.includes('metro') || 
      lowerDesc.includes('transit') || lowerDesc.includes('gas') || 
      lowerDesc.includes('parking') || lowerDesc.includes('toll')) {
    return 'Transportation';
  }
  
  // Shopping
  if (lowerDesc.includes('amazon') || lowerDesc.includes('walmart') || 
      lowerDesc.includes('target') || lowerDesc.includes('bestbuy') || 
      lowerDesc.includes('shop') || lowerDesc.includes('store') || 
      lowerDesc.includes('apple') || lowerDesc.includes('clothing') || 
      lowerDesc.includes('purchase')) {
    return 'Shopping';
  }
  
  // Entertainment
  if (lowerDesc.includes('movie') || lowerDesc.includes('netflix') || 
      lowerDesc.includes('hulu') || lowerDesc.includes('spotify') || 
      lowerDesc.includes('disney') || lowerDesc.includes('ticket') || 
      lowerDesc.includes('concert') || lowerDesc.includes('event')) {
    return 'Entertainment';
  }
  
  // Groceries
  if (lowerDesc.includes('grocery') || lowerDesc.includes('market') || 
      lowerDesc.includes('wholefoods') || lowerDesc.includes('safeway') || 
      lowerDesc.includes('kroger') || lowerDesc.includes('trader') || 
      lowerDesc.includes('food') || lowerDesc.includes('mart')) {
    return 'Groceries';
  }
  
  // Utilities
  if (lowerDesc.includes('utility') || lowerDesc.includes('electric') || 
      lowerDesc.includes('water') || lowerDesc.includes('gas') || 
      lowerDesc.includes('internet') || lowerDesc.includes('phone') || 
      lowerDesc.includes('bill') || lowerDesc.includes('cable')) {
    return 'Utilities';
  }
  
  // Housing
  if (lowerDesc.includes('rent') || lowerDesc.includes('mortgage') || 
      lowerDesc.includes('hoa') || lowerDesc.includes('housing') || 
      lowerDesc.includes('maintenance')) {
    return 'Housing';
  }
  
  // Health
  if (lowerDesc.includes('doctor') || lowerDesc.includes('medical') || 
      lowerDesc.includes('pharmacy') || lowerDesc.includes('health') || 
      lowerDesc.includes('fitness') || lowerDesc.includes('gym') || 
      lowerDesc.includes('wellness')) {
    return 'Health';
  }
  
  // Income
  if (lowerDesc.includes('payroll') || lowerDesc.includes('deposit') || 
      lowerDesc.includes('salary') || lowerDesc.includes('income') || 
      lowerDesc.includes('direct dep') || lowerDesc.includes('payment from')) {
    return 'Income';
  }
  
  return 'Other';
}

// Process Plaid transactions and store them in the database
async function syncTransactions(accessToken: string, startDate: string, endDate: string, plaidItemId: number) {
  try {
    // Get all accounts for this Plaid item
    const accounts = await storage.getAccounts();
    const plaidAccounts = accounts.filter(acc => acc.plaidItemId === plaidItemId);
    
    if (plaidAccounts.length === 0) {
      throw new Error('No accounts found for this Plaid item');
    }
    
    // Create a map of Plaid account IDs to our account IDs
    const accountMap = new Map();
    plaidAccounts.forEach(acc => {
      if (acc.plaidAccountId) {
        accountMap.set(acc.plaidAccountId, acc.id);
      }
    });
    
    // Fetch transactions from Plaid
    const plaidTransactions = await fetchTransactions(accessToken, startDate, endDate);
    
    // Process transactions
    const transactions = plaidTransactions.map(pt => {
      const accountId = accountMap.get(pt.account_id);
      
      if (!accountId) {
        console.warn(`No matching account found for Plaid account ID: ${pt.account_id}`);
        return null;
      }
      
      // Determine if it's income or expense by the amount
      let amount = pt.amount.toString();
      if (pt.amount < 0) {
        amount = (pt.amount * -1).toString(); // Make positive but keep as expense
      } else {
        amount = (-1 * pt.amount).toString(); // Make negative (income)
      }
      
      // Extract merchant name
      const merchant = pt.merchant_name || pt.name.split(' ')[0];
      
      // Categorize the transaction
      const category = pt.category ? pt.category[0] : categorizeTransaction(pt.name);
      
      return {
        accountId,
        date: new Date(pt.date),
        description: pt.name,
        amount,
        category,
        merchant,
        plaidTransactionId: pt.transaction_id,
        pending: pt.pending,
        pendingTransactionId: pt.pending_transaction_id,
        transactionType: pt.transaction_type,
        paymentChannel: pt.payment_channel,
        isPlaidTransaction: true
      };
    }).filter(t => t !== null);
    
    if (transactions.length === 0) {
      return { count: 0 };
    }
    
    // Check for existing transactions to avoid duplicates
    const existingTransactions = await storage.getTransactions();
    const existingPlaidTransactionIds = new Set();
    
    existingTransactions.forEach(et => {
      if (et.plaidTransactionId) {
        existingPlaidTransactionIds.add(et.plaidTransactionId);
      }
    });
    
    // Filter out transactions that we already have
    const newTransactions = transactions.filter(t => 
      t && t.plaidTransactionId && !existingPlaidTransactionIds.has(t.plaidTransactionId)
    );
    
    if (newTransactions.length === 0) {
      return { count: 0 };
    }
    
    // Save new transactions to database
    const savedTransactions = await storage.createTransactions(newTransactions);
    
    return { count: savedTransactions.length };
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw error;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = app.route("/api");

  // Account routes
  app.get("/api/accounts", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const parseResult = insertAccountSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid account data", errors: parseResult.error });
      }
      
      const account = await storage.createAccount(parseResult.data);
      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.put("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertAccountSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid account data", errors: parseResult.error });
      }
      
      const updatedAccount = await storage.updateAccount(id, parseResult.data);
      if (!updatedAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(updatedAccount);
    } catch (error) {
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAccount(id);
      if (!deleted) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/accounts/:accountId/transactions", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const transactions = await storage.getTransactionsByAccount(accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const parseResult = insertTransactionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid transaction data", errors: parseResult.error });
      }
      
      const transaction = await storage.createTransaction(parseResult.data);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.post("/api/transactions/bulk", async (req: Request, res: Response) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body must be an array of transactions" });
      }

      const parseResults = req.body.map(item => insertTransactionSchema.safeParse(item));
      const invalidResults = parseResults.filter(result => !result.success);
      
      if (invalidResults.length > 0) {
        return res.status(400).json({ 
          message: "Invalid transaction data", 
          errors: invalidResults.map(result => result.error) 
        });
      }
      
      const validTransactions = parseResults
        .filter((result): result is { success: true; data: any } => result.success)
        .map(result => result.data);
      
      const transactions = await storage.createTransactions(validTransactions);
      res.status(201).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to create transactions" });
    }
  });

  app.post("/api/transactions/import", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const accountId = parseInt(req.body.accountId);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }

      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      const records: any[] = [];
      
      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      const csvPromise = new Promise<void>((resolve, reject) => {
        parser.on('error', function(err) {
          reject(err);
        });
        
        parser.on('end', function() {
          resolve();
        });
      });

      const stream = Readable.from(req.file.buffer);
      stream.pipe(parser);
      
      await csvPromise;

      // Transform records to transactions
      const transactions = records.map(record => {
        // Expected CSV format: date,description,amount,category,merchant
        return {
          accountId,
          date: new Date(record.date),
          description: record.description,
          amount: parseFloat(record.amount),
          category: record.category || 'Other',
          merchant: record.merchant || record.description.split(' ')[0]
        };
      });

      const createdTransactions = await storage.createTransactions(transactions);
      res.status(201).json({ message: "Transactions imported successfully", count: createdTransactions.length });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import transactions" });
    }
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTransaction(id);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const parseResult = insertCategorySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid category data", errors: parseResult.error });
      }
      
      const category = await storage.createCategory(parseResult.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Insight routes
  app.get("/api/insights", async (req: Request, res: Response) => {
    try {
      const insights = await storage.getInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.post("/api/insights", async (req: Request, res: Response) => {
    try {
      const parseResult = insertInsightSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid insight data", errors: parseResult.error });
      }
      
      const insight = await storage.createInsight(parseResult.data);
      res.status(201).json(insight);
    } catch (error) {
      res.status(500).json({ message: "Failed to create insight" });
    }
  });

  // Plaid routes
  app.get("/api/plaid/create-link-token", async (req: Request, res: Response) => {
    try {
      // Generate a unique user ID or use from session
      const userId = "user-" + Date.now();
      const linkTokenResponse = await createLinkToken(userId);
      res.json({ 
        linkToken: linkTokenResponse.link_token 
      });
    } catch (error) {
      console.error("Create link token error:", error);
      res.status(500).json({ message: "Failed to create link token" });
    }
  });

  app.post("/api/plaid/exchange-token", async (req: Request, res: Response) => {
    try {
      const { publicToken } = req.body;
      
      if (!publicToken) {
        return res.status(400).json({ message: "Missing public token" });
      }
      
      // Exchange public token for access token
      const { accessToken, itemId } = await exchangePublicToken(publicToken);
      
      // Get institution information
      const institutionId = "unknown"; // In real app, get this from Plaid
      const institution = "Connected Bank"; // In real app, get this from Plaid
      
      // Create Plaid item record
      const plaidItem = await storage.createPlaidItem({
        institution,
        itemId,
        accessToken,
        status: "active",
        institutionId: institutionId,
        lastUpdated: new Date()
      });
      
      // Get accounts from Plaid
      const plaidAccounts = await fetchAccounts(accessToken);
      
      // Create accounts in local storage
      for (const account of plaidAccounts) {
        await storage.createAccount({
          name: account.name,
          type: account.type,
          institution,
          balance: account.balances.current?.toString() || "0",
          accountNumber: account.mask || "xxxx",
          plaidItemId: plaidItem.id,
          plaidAccountId: account.account_id,
          isPlaidConnected: true,
          lastUpdated: new Date()
        });
      }
      
      // Sync transactions
      const now = new Date();
      const startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1); // Get 1 year of transactions
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = now.toISOString().split('T')[0];
      
      await syncTransactions(accessToken, formattedStartDate, formattedEndDate, plaidItem.id);
      
      res.json({ 
        success: true,
        message: "Bank connected successfully" 
      });
    } catch (error) {
      console.error("Exchange token error:", error);
      res.status(500).json({ message: "Failed to exchange token" });
    }
  });

  app.post("/api/plaid/sync-account/:id", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      if (!account.isPlaidConnected || !account.plaidItemId) {
        return res.status(400).json({ message: "Account is not connected to Plaid" });
      }
      
      const plaidItem = await storage.getPlaidItem(account.plaidItemId);
      
      if (!plaidItem) {
        return res.status(404).json({ message: "Plaid connection not found" });
      }
      
      // Sync transactions
      const now = new Date();
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3); // Get 3 months of transactions
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = now.toISOString().split('T')[0];
      
      await syncTransactions(plaidItem.accessToken, formattedStartDate, formattedEndDate, plaidItem.id);
      
      // Update account last updated timestamp
      await storage.updateAccount(accountId, { lastUpdated: new Date() });
      
      res.json({ 
        success: true, 
        message: "Account synced successfully" 
      });
    } catch (error) {
      console.error("Sync account error:", error);
      res.status(500).json({ message: "Failed to sync account" });
    }
  });

  app.post("/api/plaid/disconnect-account/:id", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      if (!account.isPlaidConnected || !account.plaidItemId) {
        return res.status(400).json({ message: "Account is not connected to Plaid" });
      }
      
      // Get Plaid item
      const plaidItem = await storage.getPlaidItem(account.plaidItemId);
      
      if (!plaidItem) {
        return res.status(404).json({ message: "Plaid connection not found" });
      }
      
      // Get all accounts with the same Plaid item ID
      const accounts = await storage.getAccounts();
      const relatedAccounts = accounts.filter(a => a.plaidItemId === account.plaidItemId);
      
      if (relatedAccounts.length === 1) {
        // This is the only account using this Plaid item, so delete the item
        await storage.deletePlaidItem(plaidItem.id);
      }
      
      // Update account to disconnect from Plaid
      await storage.updateAccount(accountId, {
        isPlaidConnected: false,
        plaidItemId: null,
        plaidAccountId: null
      });
      
      res.json({ 
        success: true, 
        message: "Account disconnected successfully" 
      });
    } catch (error) {
      console.error("Disconnect account error:", error);
      res.status(500).json({ message: "Failed to disconnect account" });
    }
  });

  // Statistics endpoint for dashboard
  app.get("/api/statistics/dashboard", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getAccounts();
      const transactions = await storage.getTransactions();

      // Calculate total balance
      const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
      
      // Calculate monthly income (sum of positive transactions in current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      const monthlyIncome = monthlyTransactions
        .filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Calculate monthly spending (sum of negative transactions in current month)
      const monthlySpending = monthlyTransactions
        .filter(t => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      
      // Get spending by category
      const categories = await storage.getCategories();
      const spendingByCategory = categories.map(category => {
        const categoryTransactions = monthlyTransactions.filter(t => 
          t.category === category.name && Number(t.amount) < 0
        );
        
        const amount = categoryTransactions.reduce((sum, t) => 
          sum + Math.abs(Number(t.amount)), 0
        );
        
        return {
          category: category.name,
          amount,
          color: category.color
        };
      }).filter(item => item.amount > 0);

      // Calculate spending trends (last 6 months)
      const trendMonths = 6;
      const trends = [];
      
      for (let i = 0; i < trendMonths; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === month && tDate.getFullYear() === year;
        });
        
        const income = monthTransactions
          .filter(t => Number(t.amount) > 0)
          .reduce((sum, t) => sum + Number(t.amount), 0);
          
        const spending = monthTransactions
          .filter(t => Number(t.amount) < 0)
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        
        trends.unshift({
          month: date.toLocaleString('default', { month: 'long' }),
          income,
          spending
        });
      }

      res.json({
        totalBalance,
        monthlyIncome,
        monthlySpending,
        spendingByCategory,
        trends
      });
    } catch (error) {
      console.error("Statistics error:", error);
      res.status(500).json({ message: "Failed to calculate statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
