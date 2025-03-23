import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';

type FinanceSummaryProps = {
  className?: string;
};

type DashboardStats = {
  totalBalance: number;
  monthlyIncome: number;
  monthlySpending: number;
};

export default function FinanceSummary({ className }: FinanceSummaryProps) {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/statistics/dashboard'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 w-36 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const balanceData = [
    {
      title: 'Total Balance',
      value: data?.totalBalance || 0,
      change: 4.6,
      changeAmount: 2980,
      isPositive: true,
      icon: <TrendingUp className="h-4 w-4 mr-1" />,
    },
    {
      title: 'Monthly Income',
      value: data?.monthlyIncome || 0,
      change: 2.1,
      changeAmount: 260,
      isPositive: true,
      icon: <TrendingUp className="h-4 w-4 mr-1" />,
    },
    {
      title: 'Monthly Spending',
      value: data?.monthlySpending || 0,
      change: 8.2,
      changeAmount: 624,
      isPositive: false,
      icon: <TrendingDown className="h-4 w-4 mr-1" />,
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${className}`}>
      {balanceData.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-text-light">{item.title}</p>
              <h2 className="mt-1 text-2xl font-bold font-inter text-text">
                {formatCurrency(item.value)}
              </h2>
              <p className="mt-1 text-sm">
                <span className={`flex items-center ${item.isPositive ? 'text-success' : 'text-alert'}`}>
                  {item.icon}
                  {item.isPositive ? '+' : ''}{item.change}% (${item.changeAmount})
                </span>
                <span className="text-text-light ml-1">from last month</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <button className="p-1.5 rounded-md text-text-light hover:bg-gray-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
