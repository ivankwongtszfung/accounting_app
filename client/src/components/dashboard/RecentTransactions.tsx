import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { 
  CreditCardIcon, 
  ShoppingCartIcon, 
  UtensilsIcon, 
  HomeIcon 
} from 'lucide-react';
import { Transaction } from '@shared/schema';

// Helper function to get an icon based on category
function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'shopping':
      return <ShoppingCartIcon className="h-4 w-4" />;
    case 'dining':
      return <UtensilsIcon className="h-4 w-4" />;
    case 'housing':
      return <HomeIcon className="h-4 w-4" />;
    default:
      return <CreditCardIcon className="h-4 w-4" />;
  }
}

// Helper function to get background color based on category
function getCategoryBgColor(category: string) {
  switch (category.toLowerCase()) {
    case 'shopping':
      return 'bg-blue-100 text-blue-600';
    case 'dining':
      return 'bg-orange-100 text-orange-600';
    case 'housing':
      return 'bg-red-100 text-red-600';
    case 'household':
      return 'bg-purple-100 text-purple-600';
    case 'income':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// Helper function to get badge color
function getCategoryBadgeColor(category: string) {
  switch (category.toLowerCase()) {
    case 'shopping':
      return 'bg-blue-100 text-blue-800';
    case 'dining':
      return 'bg-orange-100 text-orange-800';
    case 'housing':
      return 'bg-red-100 text-red-800';
    case 'household':
      return 'bg-purple-100 text-purple-800';
    case 'income':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Format date to readable format
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold font-inter">Recent Transactions</h3>
        <Link href="/transactions" className="text-secondary hover:text-secondary-light text-sm font-medium">
          View All
        </Link>
      </div>
      
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="ml-3">
                          <div className="h-4 w-24 bg-gray-200 rounded"></div>
                          <div className="h-3 w-16 bg-gray-100 rounded mt-1"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-6 w-16 bg-gray-200 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                    <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-gray-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getCategoryBgColor(transaction.category)}`}>
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-text">{transaction.merchant}</p>
                          <p className="text-xs text-text-light">{transaction.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryBadgeColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-light">
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${Number(transaction.amount) >= 0 ? 'text-success' : 'text-alert'}`}>
                      {Number(transaction.amount) >= 0 ? '+' : ''}{formatCurrency(Number(transaction.amount))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-light">
                    No transactions found. Import some transactions to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
