import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { log } from './vite';

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Create a link token for initializing Plaid Link
export async function createLinkToken(userId: string) {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Financial Dashboard',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    
    return response.data;
  } catch (error) {
    log(`Error creating link token: ${JSON.stringify(error)}`, 'plaid');
    throw error;
  }
}

// Exchange public token for access token
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error) {
    log(`Error exchanging public token: ${JSON.stringify(error)}`, 'plaid');
    throw error;
  }
}

// Fetch transactions for an account
export async function fetchTransactions(accessToken: string, startDate: string, endDate: string) {
  try {
    // Get all transactions
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    let transactions = response.data.transactions;
    
    // Handle pagination if needed
    const totalTransactions = response.data.total_transactions;
    let hasMore = transactions.length < totalTransactions;
    while (hasMore) {
      const paginatedResponse = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          offset: transactions.length,
        },
      });
      
      transactions = [...transactions, ...paginatedResponse.data.transactions];
      hasMore = transactions.length < totalTransactions;
    }
    
    return transactions;
  } catch (error) {
    log(`Error fetching transactions: ${JSON.stringify(error)}`, 'plaid');
    throw error;
  }
}

// Fetch account information
export async function fetchAccounts(accessToken: string) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    
    return response.data.accounts;
  } catch (error) {
    log(`Error fetching accounts: ${JSON.stringify(error)}`, 'plaid');
    throw error;
  }
}