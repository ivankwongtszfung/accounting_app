import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

type TrendChartData = {
  month: string;
  income: number;
  spending: number;
};

type DashboardStats = {
  trends: TrendChartData[];
};

export default function SpendingTrendChart() {
  const [timeRange, setTimeRange] = useState('6months');
  
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/statistics/dashboard'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold font-inter">Spending Trends</h3>
        <div className="flex">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="text-sm border-gray-300 w-[180px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-64">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <p>Loading chart data...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data?.trends || []}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={formatCurrency}
                width={80}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#43A047"
                activeDot={{ r: 8 }}
                strokeWidth={2}
                dot={{ r: 4 }}
                fill="rgba(67, 160, 71, 0.1)"
              />
              <Line
                type="monotone"
                dataKey="spending"
                name="Expenses"
                stroke="#F44336"
                activeDot={{ r: 8 }}
                strokeWidth={2}
                dot={{ r: 4 }}
                fill="rgba(244, 67, 54, 0.1)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
