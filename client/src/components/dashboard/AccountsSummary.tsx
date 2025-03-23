import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, CreditCardIcon, WalletIcon, PiggyBankIcon, BarChartIcon } from 'lucide-react';
import { Account } from '@shared/schema';

function getAccountIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'checking':
      return <CreditCardIcon className="h-6 w-6 text-blue-600" />;
    case 'savings':
      return <PiggyBankIcon className="h-6 w-6 text-green-600" />;
    case 'investment':
      return <BarChartIcon className="h-6 w-6 text-purple-600" />;
    case 'credit':
      return <CreditCardIcon className="h-6 w-6 text-red-600" />;
    default:
      return <WalletIcon className="h-6 w-6 text-blue-600" />;
  }
}

function getAccountBgColor(type: string) {
  switch (type.toLowerCase()) {
    case 'checking':
      return 'bg-blue-50';
    case 'savings':
      return 'bg-green-50';
    case 'investment':
      return 'bg-purple-50';
    case 'credit':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
}

function getAccountIconBgColor(type: string) {
  switch (type.toLowerCase()) {
    case 'checking':
      return 'bg-blue-100';
    case 'savings':
      return 'bg-green-100';
    case 'investment':
      return 'bg-purple-100';
    case 'credit':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

export default function AccountsSummary() {
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const lastUpdated = new Date(date);
    const diffInHours = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours === 1) {
      return '1h ago';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const formatAccountNumber = (accountNumber: string) => {
    return `**** ${accountNumber.slice(-4)}`;
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold font-inter">Your Accounts</h3>
        <Link href="/accounts">
          <a className="text-secondary hover:text-secondary-light text-sm font-medium">View All</a>
        </Link>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="ml-3">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 mt-1 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
                  <div className="h-3 w-24 mt-1 bg-gray-100 rounded ml-auto"></div>
                </div>
              </div>
            </div>
          ))
        ) : accounts && accounts.length > 0 ? (
          accounts.map((account, index) => (
            <div key={index} className={`p-3 ${getAccountBgColor(account.type)} rounded-lg`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full ${getAccountIconBgColor(account.type)} flex items-center justify-center`}>
                    {getAccountIcon(account.type)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text">{account.name}</p>
                    <p className="text-xs text-text-light">{formatAccountNumber(account.accountNumber)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${Number(account.balance) >= 0 ? 'text-text' : 'text-alert'}`}>
                    {formatCurrency(Number(account.balance))}
                  </p>
                  <p className="text-xs text-text-light">Last updated: {formatLastUpdated(account.lastUpdated)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-lg">
            <p className="text-text-light mb-4">No accounts added yet.</p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md text-text-light text-sm hover:bg-gray-50"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Account
        </Button>
      </div>
    </Card>
  );
}
