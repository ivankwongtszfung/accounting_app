import { InsertTransaction } from "@shared/schema";
import { categorizeTransaction } from "./categorize";

/**
 * Expected CSV formats supported:
 * 1. Standard format: date,description,amount,category,merchant
 * 2. Simple format: date,description,amount
 * 3. Bank format: date,description,debit,credit,balance
 */

export interface ParsedCsvResult {
  transactions: InsertTransaction[];
  errors: string[];
}

/**
 * Parse CSV data into transaction objects
 * 
 * @param csvData String content of a CSV file
 * @param accountId ID of the account to associate transactions with
 * @returns Object containing parsed transactions and any errors
 */
export function parseTransactionCsv(csvData: string, accountId: number): ParsedCsvResult {
  const result: ParsedCsvResult = {
    transactions: [],
    errors: []
  };
  
  // Split CSV into lines
  const lines = csvData.split(/\r?\n/);
  
  // Get headers from first line
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  // Detect CSV format
  const format = detectCsvFormat(headers);
  if (!format) {
    result.errors.push("Unsupported CSV format. Expected columns: date, description, amount (or debit/credit)");
    return result;
  }
  
  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    try {
      const transaction = parseCsvLine(line, headers, format, accountId);
      if (transaction) {
        result.transactions.push(transaction);
      }
    } catch (error) {
      result.errors.push(`Error on line ${i + 1}: ${(error as Error).message}`);
    }
  }
  
  return result;
}

/**
 * Detect the format of the CSV based on headers
 */
function detectCsvFormat(headers: string[]): string | null {
  // Standard format
  if (headers.includes('date') && headers.includes('description') && headers.includes('amount')) {
    return 'standard';
  }
  
  // Bank format with debit/credit columns
  if (headers.includes('date') && headers.includes('description') && 
      (headers.includes('debit') || headers.includes('credit'))) {
    return 'bank';
  }
  
  return null;
}

/**
 * Parse a single CSV line into a transaction object
 */
function parseCsvLine(
  line: string, 
  headers: string[], 
  format: string, 
  accountId: number
): InsertTransaction | null {
  const values = parseCsvValues(line);
  
  // Ensure we have enough values
  if (values.length < headers.length) {
    throw new Error(`Line has ${values.length} values but expected ${headers.length}`);
  }
  
  // Create an object mapping headers to values
  const row: Record<string, string> = {};
  headers.forEach((header, index) => {
    row[header] = values[index];
  });
  
  // Parse date
  const dateStr = row['date'];
  if (!dateStr) throw new Error("Missing date");
  
  let date: Date;
  try {
    // Try different date formats
    date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try DD/MM/YYYY format
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        // Try both MM/DD/YYYY and DD/MM/YYYY
        date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        if (isNaN(date.getTime())) {
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    }
    
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }
  } catch (error) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  
  // Parse description
  const description = row['description'] || 'Unknown';
  
  // Parse amount based on format
  let amount: number;
  if (format === 'standard') {
    amount = parseFloat(row['amount']);
    if (isNaN(amount)) throw new Error(`Invalid amount: ${row['amount']}`);
  } else if (format === 'bank') {
    const debit = row['debit'] ? parseFloat(row['debit']) : 0;
    const credit = row['credit'] ? parseFloat(row['credit']) : 0;
    
    if (!isNaN(debit) && debit > 0) {
      amount = -debit; // Debit is a negative amount (outgoing)
    } else if (!isNaN(credit) && credit > 0) {
      amount = credit; // Credit is a positive amount (incoming)
    } else {
      throw new Error("Missing or invalid debit/credit values");
    }
  } else {
    throw new Error("Unsupported format");
  }
  
  // Create the transaction
  const transaction: InsertTransaction = {
    accountId,
    date,
    description,
    amount,
    // Use provided category or merchant, or auto-categorize if not available
    category: row['category'] || 'Other',
    merchant: row['merchant'] || extractMerchant(description)
  };
  
  // Auto-categorize if needed
  if (!row['category'] || row['category'].trim() === '') {
    transaction.category = categorizeTransaction(transaction);
  }
  
  return transaction;
}

/**
 * Extract merchant name from transaction description
 */
function extractMerchant(description: string): string {
  // Take first word or first few words as merchant name
  const words = description.split(' ');
  if (words.length === 0) return 'Unknown';
  
  // If the description is short, use the whole thing
  if (words.length <= 3) return description;
  
  // Otherwise, use the first word or two
  return words.slice(0, 2).join(' ');
}

/**
 * Parse CSV values, handling quoted values properly
 */
function parseCsvValues(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue.trim());
  
  return values;
}

/**
 * Convert transactions to CSV format for export
 */
export function transactionsToCSV(transactions: InsertTransaction[] | any[]): string {
  // Add headers
  let csv = 'Date,Description,Amount,Category,Merchant\n';
  
  // Add each transaction
  transactions.forEach(tx => {
    const date = new Date(tx.date).toISOString().split('T')[0];
    const description = `"${tx.description.replace(/"/g, '""')}"`;
    const amount = typeof tx.amount === 'number' ? tx.amount.toFixed(2) : tx.amount;
    const category = tx.category || 'Other';
    const merchant = `"${(tx.merchant || '').replace(/"/g, '""')}"`;
    
    csv += `${date},${description},${amount},${category},${merchant}\n`;
  });
  
  return csv;
}
