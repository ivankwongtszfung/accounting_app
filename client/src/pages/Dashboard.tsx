import Header from '@/components/layout/Header';
import FinanceSummary from '@/components/dashboard/FinanceSummary';
import SpendingTrendChart from '@/components/dashboard/SpendingTrendChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import AccountsSummary from '@/components/dashboard/AccountsSummary';
import SpendingByCategory from '@/components/dashboard/SpendingByCategory';
import SavingsInsights from '@/components/dashboard/SavingsInsights';

export default function Dashboard() {
  // Get current date for the header subtitle
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      <Header 
        title="Financial Dashboard" 
        subtitle={`Last updated: ${formattedDate}`}
        showExport
        showImport
      />

      <div className="px-4 pb-8">
        {/* Finance Summary Section */}
        <FinanceSummary />

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Spending Trend Chart */}
            <SpendingTrendChart />

            {/* Recent Transactions */}
            <RecentTransactions />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Accounts Summary */}
            <AccountsSummary />

            {/* Spending by Category */}
            <SpendingByCategory />

            {/* Savings Insights */}
            <SavingsInsights />
          </div>
        </div>
      </div>
    </>
  );
}
