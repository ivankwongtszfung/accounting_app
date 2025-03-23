import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, AlertCircle } from 'lucide-react';

export default function Budgets() {
  return (
    <>
      <Header 
        title="Budgets" 
        subtitle="Set and track spending limits for different categories"
      />

      <div className="px-4 pb-8">
        <div className="flex justify-end mb-6">
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Budget
          </Button>
        </div>

        <div className="text-center">
          <Card className="p-8 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Budgets Created Yet</h3>
            <p className="text-gray-500 mb-6">
              Create a budget to start tracking your spending against your goals.
            </p>
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Budget
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
