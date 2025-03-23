import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Transaction } from '@shared/schema';
import { SearchIcon, FilterIcon, ArrowUpDownIcon, CreditCardIcon, ShoppingCartIcon, UtensilsIcon, HomeIcon } from 'lucide-react';

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

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
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

  // Filter and sort transactions
  const filteredAndSortedTransactions = () => {
    if (!transactions) return [];

    let filtered = transactions;

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t => t.description.toLowerCase().includes(search) || 
             t.merchant.toLowerCase().includes(search) || 
             t.category.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-desc':
        sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
        break;
      case 'amount-asc':
        sorted.sort((a, b) => Number(a.amount) - Number(b.amount));
        break;
    }

    return sorted;
  };

  return (
    <>
      <Header 
        title="Transactions" 
        subtitle="View, search, and filter all your transactions"
        showImport
      />

      <div className="px-4 pb-8">
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-1/3">
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
              <div className="flex items-center space-x-2 w-full md:w-1/2">
                <FilterIcon className="h-5 w-5 text-gray-400" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories && categories.map((category, index) => (
                      <SelectItem key={index} value={category.name.toLowerCase()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 w-full md:w-1/2">
                <ArrowUpDownIcon className="h-5 w-5 text-gray-400" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest first)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
                    <SelectItem value="amount-desc">Amount (Highest first)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Lowest first)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
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
                    Array.from({ length: 10 }).map((_, index) => (
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
                  ) : filteredAndSortedTransactions().length > 0 ? (
                    filteredAndSortedTransactions().map((transaction, index) => (
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
                        {searchTerm || categoryFilter !== 'all' ? 
                          'No transactions match your search criteria.' : 
                          'No transactions found. Import some transactions to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
