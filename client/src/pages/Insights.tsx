import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { 
  SlidersHorizontal, 
  Lightbulb,
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Insight } from '@shared/schema';

function getInsightIcon(type: string) {
  switch (type) {
    case 'subscription':
      return <SlidersHorizontal className="h-6 w-6" />;
    case 'high-yield':
      return <Lightbulb className="h-6 w-6" />;
    case 'spending-alert':
      return <DollarSign className="h-6 w-6" />;
    default:
      return <Lightbulb className="h-6 w-6" />;
  }
}

function getInsightColors(type: string) {
  switch (type) {
    case 'subscription':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600'
      };
    case 'high-yield':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100 text-green-600'
      };
    case 'spending-alert':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'bg-yellow-100 text-yellow-600'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'bg-gray-100 text-gray-600'
      };
  }
}

function formatCurrency(amount: number | null) {
  if (amount === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function Insights() {
  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ['/api/insights'],
  });

  return (
    <>
      <Header 
        title="Savings Insights" 
        subtitle="Discover opportunities to save money and optimize your finances"
      />

      <div className="px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-primary text-white">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <TrendingUp className="h-10 w-10 mb-2" />
                <h3 className="text-xl font-bold">Total Potential Savings</h3>
                <p className="mt-1 text-green-100">Based on all available insights</p>
              </div>
              <div className="mt-auto">
                <p className="text-3xl font-bold">
                  {isLoading ? (
                    <span className="animate-pulse">Calculating...</span>
                  ) : insights ? (
                    formatCurrency(insights.reduce((sum, insight) => sum + Number(insight.savingsAmount || 0), 0))
                  ) : (
                    '$0.00'
                  )}
                </p>
                <p className="mt-2 text-green-100">per year</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-secondary text-white">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <Lightbulb className="h-10 w-10 mb-2" />
                <h3 className="text-xl font-bold">Insights Available</h3>
                <p className="mt-1 text-blue-100">Personalized recommendations</p>
              </div>
              <div className="mt-auto">
                <p className="text-3xl font-bold">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : insights ? (
                    insights.length
                  ) : (
                    '0'
                  )}
                </p>
                <p className="mt-2 text-blue-100">active insights</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-dashed border-gray-300 flex flex-col justify-center items-center text-center">
            <AlertCircle className="h-10 w-10 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Need More Insights?</h3>
            <p className="mb-4 text-gray-500 text-sm">Import more transactions to get personalized recommendations</p>
            <Button variant="outline">Import Transactions</Button>
          </Card>
        </div>

        <h3 className="text-xl font-bold mb-4">All Insights</h3>
        
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-6 animate-pulse">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded mb-1"></div>
                    <div className="h-4 w-5/6 bg-gray-100 rounded mb-3"></div>
                    <div className="h-8 w-36 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : insights && insights.length > 0 ? (
            insights.map((insight, index) => {
              const colors = getInsightColors(insight.type);
              return (
                <Card key={index} className={`p-6 ${colors.bg} border ${colors.border}`}>
                  <div className="flex flex-col md:flex-row md:items-start">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colors.icon} flex items-center justify-center mb-4 md:mb-0 md:mr-4`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2">{insight.title}</h4>
                      <p className="text-gray-700 mb-4">{insight.description}</p>
                      
                      {insight.savingsAmount && (
                        <div className="mb-4">
                          <span className="text-gray-600 mr-2">Potential savings:</span>
                          <span className="font-bold text-success">{formatCurrency(Number(insight.savingsAmount))}</span>
                          <span className="text-gray-600 ml-1">{insight.type === 'high-yield' ? '/year' : '/month'}</span>
                        </div>
                      )}
                      
                      <Button variant="outline" asChild className="mt-2">
                        <a href={insight.actionLink || '#'}>
                          {insight.type === 'subscription' ? 'Review Subscriptions' : 
                           insight.type === 'high-yield' ? 'Compare Rates' : 'Create Budget'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Insights Available</h3>
              <p className="text-gray-500 mb-6">
                We need more of your transaction data to generate personalized insights.
                Import transactions to get started.
              </p>
              <Button>Import Transactions</Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
