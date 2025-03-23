import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RefreshCw, Trash2, Building, AlertCircle } from 'lucide-react';
import { Account } from '@shared/schema';

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const ConnectedAccounts = () => {
  const [refreshingAccount, setRefreshingAccount] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const plaidAccounts = accounts?.filter(account => account.isPlaidConnected) || [];

  const { mutate: syncAccount, isPending: isSyncing } = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest(`/api/plaid/sync-account/${accountId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Account Synced',
        description: 'Your account transactions have been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setRefreshingAccount(null);
    },
    onError: (error) => {
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync account transactions. Please try again.',
        variant: 'destructive',
      });
      setRefreshingAccount(null);
    },
  });

  const { mutate: disconnectAccount } = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest(`/api/plaid/disconnect-account/${accountId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Account Disconnected',
        description: 'Your bank account has been disconnected.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: (error) => {
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect your bank account. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleRefresh = (accountId: number) => {
    setRefreshingAccount(accountId);
    syncAccount(accountId);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (plaidAccounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Bank Accounts</CardTitle>
          <CardDescription>
            You don't have any bank accounts connected yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Connected Bank Accounts</h3>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plaidAccounts.map((account) => (
          <Card key={account.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{account.name}</CardTitle>
                  <CardDescription>{account.institution}</CardDescription>
                </div>
                <div className="rounded-full bg-primary/10 p-2">
                  <Building className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                <p className="text-2xl font-semibold">{formatCurrency(account.balance)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last updated: {new Date(account.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefresh(account.id)}
                  disabled={isSyncing && refreshingAccount === account.id}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing && refreshingAccount === account.id ? 'animate-spin' : ''}`} />
                  {isSyncing && refreshingAccount === account.id ? 'Syncing...' : 'Sync'}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to disconnect this account? Your transaction history will be preserved, but you'll need to reconnect to get new transactions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => disconnectAccount(account.id)}>
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConnectedAccounts;