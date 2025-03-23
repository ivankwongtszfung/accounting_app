import { pgTable, text, serial, numeric, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Plaid Items table - represents a connection to a financial institution
export const plaidItems = pgTable("plaid_items", {
  id: serial("id").primaryKey(),
  itemId: text("item_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  institution: text("institution").notNull(),
  institutionId: text("institution_id"),
  status: text("status").notNull().default("active"),
  consentExpiresAt: timestamp("consent_expires_at"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertPlaidItemSchema = createInsertSchema(plaidItems).omit({
  id: true,
  lastUpdated: true,
});

export type InsertPlaidItem = z.infer<typeof insertPlaidItemSchema>;
export type PlaidItem = typeof plaidItems.$inferSelect;

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit, investment
  institution: text("institution").notNull(),
  balance: numeric("balance").notNull(),
  accountNumber: text("account_number").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  // Plaid-specific fields
  plaidItemId: integer("plaid_item_id"),
  plaidAccountId: text("plaid_account_id"),
  isPlaidConnected: boolean("is_plaid_connected").default(false),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(),
  merchant: text("merchant").notNull(),
  // Plaid-specific fields
  plaidTransactionId: text("plaid_transaction_id"),
  pending: boolean("pending").default(false),
  pendingTransactionId: text("pending_transaction_id"),
  transactionType: text("transaction_type"),
  paymentChannel: text("payment_channel"),
  isPlaidTransaction: boolean("is_plaid_transaction").default(false),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  savingsAmount: numeric("savings_amount"),
  type: text("type").notNull(), // subscription, high-yield, spending-alert
  actionLink: text("action_link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  createdAt: true,
});

export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;
