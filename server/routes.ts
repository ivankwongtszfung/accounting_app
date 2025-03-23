import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSchema, insertTransactionSchema, insertCategorySchema, insertInsightSchema } from "@shared/schema";
import multer from "multer";
import { Readable } from "stream";
import { parse } from "csv-parse";

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
