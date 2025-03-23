import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type CategorySpending = {
  category: string;
  amount: number;
  color: string;
};

type DashboardStats = {
  spendingByCategory: CategorySpending[];
};

export default function SpendingByCategory() {
  const [timeRange, setTimeRange] = useState('month');
  
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/statistics/dashboard'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Calculate percentages
  const calculatePercentage = (amount: number) => {
    if (!data?.spendingByCategory) return 0;
    const total = data.spendingByCategory.reduce((sum, item) => sum + item.amount, 0);
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold font-inter">Spending by Category</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="text-sm border-gray-300 w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="quarter">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-64 mb-4">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <p>Loading chart data...</p>
          </div>
        ) : data?.spendingByCategory && data.spendingByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.spendingByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={60}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
              >
                {data.spendingByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-text-light">No spending data available</p>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {data?.spendingByCategory && data.spendingByCategory.length > 0 ? (
          data.spendingByCategory.slice(0, 4).map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm text-text">{category.category}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-text mr-2">
                  {formatCurrency(category.amount)}
                </span>
                <span className="text-xs text-text-light">{calculatePercentage(category.amount)}%</span>
              </div>
            </div>
          ))
        ) : !isLoading && (
          <div className="text-center py-2">
            <p className="text-text-light text-sm">No category data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
