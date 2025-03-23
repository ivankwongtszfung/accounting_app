import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PlaidLinkContainer from './PlaidLinkContainer';
import { PlusCircle } from 'lucide-react';

interface ConnectBankModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const ConnectBankModal = ({ trigger, onSuccess }: ConnectBankModalProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Connect Bank</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Your Bank Account</DialogTitle>
          <DialogDescription>
            Securely connect your bank accounts to automatically import transactions and track your finances.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">By connecting your accounts, you'll be able to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Automatically import transactions</li>
              <li>Track balances across all your accounts</li>
              <li>Get personalized financial insights</li>
              <li>Set up budget categories intelligently</li>
            </ul>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-xs text-gray-500 dark:text-gray-400">
            Your security is our priority. We use bank-level encryption and never store your credentials.
          </div>
        </div>
        <div className="flex justify-end">
          <PlaidLinkContainer onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectBankModal;