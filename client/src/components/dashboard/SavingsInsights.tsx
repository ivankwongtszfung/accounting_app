import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';
import { 
  SlidersHorizontal, 
  Lightbulb,
  DollarSign
} from 'lucide-react';
import { Insight } from '@shared/schema';

type InsightIconProps = {
  type: string;
};

function InsightIcon({ type }: InsightIconProps) {
  switch (type) {
    case 'subscription':
      return <SlidersHorizontal className="h-5 w-5" />;
    case 'high-yield':
      return <Lightbulb className="h-5 w-5" />;
    case 'spending-alert':
      return <DollarSign className="h-5 w-5" />;
    default:
      return <Lightbulb className="h-5 w-5" />;
  }
}

function getInsightBackgroundClass(type: string) {
  switch (type) {
    case 'subscription':
      return 'bg-blue-50';
    case 'high-yield':
      return 'bg-green-50';
    case 'spending-alert':
      return 'bg-yellow-50';
    default:
      return 'bg-gray-50';
  }
}

function getInsightIconBgClass(type: string) {
  switch (type) {
    case 'subscription':
      return 'bg-blue-100 text-blue-600';
    case 'high-yield':
      return 'bg-green-100 text-green-600';
    case 'spending-alert':
      return 'bg-yellow-100 text-yellow-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export default function SavingsInsights() {
  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ['/api/insights'],
  });

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold font-inter">Savings Insights</h3>
        <Link href="/insights">
          <a className="text-secondary hover:text-secondary-light text-sm font-medium">View All</a>
        </Link>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full mt-1"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 w-36 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-4/5 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))
        ) : insights && insights.length > 0 ? (
          insights.slice(0, 3).map((insight, index) => (
            <div key={index} className={`p-3 ${getInsightBackgroundClass(insight.type)} rounded-lg`}>
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${getInsightIconBgClass(insight.type)}`}>
                  <InsightIcon type={insight.type} />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-text">{insight.title}</h4>
                  <p className="mt-1 text-xs text-text-light">{insight.description}</p>
                  <Link href={insight.actionLink || '/insights'}>
                    <a className="mt-2 inline-block text-xs font-medium text-secondary hover:text-secondary-light">
                      {insight.type === 'subscription' ? 'Show Details' : 
                        insight.type === 'high-yield' ? 'Learn More' : 'Create Budget'}
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-lg">
            <p className="text-text-light mb-2">No savings insights available yet.</p>
            <p className="text-xs text-text-light">Import more transactions to generate personalized insights.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
