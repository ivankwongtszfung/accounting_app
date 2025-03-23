import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon, CreditCardIcon, WalletIcon, PiggyBankIcon, BarChartIcon, Pencil, Trash2, RefreshCw, Building } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Account } from '@shared/schema';
import { ConnectBankModal } from '@/components/plaid';
import { ConnectedAccounts } from '@/components/plaid';

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

function getAccountColor(type: string) {
  switch (type.toLowerCase()) {
    case 'checking':
      return 'text-blue-600 border-blue-600';
    case 'savings':
      return 'text-green-600 border-green-600';
    case 'investment':
      return 'text-purple-600 border-purple-600';
    case 'credit':
      return 'text-red-600 border-red-600';
    default:
      return 'text-gray-600 border-gray-600';
  }
}

const formSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters.'),
  type: z.string().min(1, 'Please select an account type.'),
  institution: z.string().min(2, 'Institution name must be at least 2 characters.'),
  balance: z.string().refine(
    val => !isNaN(parseFloat(val)),
    { message: 'Balance must be a number.' }
  ),
  accountNumber: z.string().min(4, 'Account number must be at least 4 characters.')
});

type FormValues = z.infer<typeof formSchema>;

export default function Accounts() {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts']
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      institution: '',
      balance: '0',
      accountNumber: ''
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          balance: data.balance
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: 'Account created',
        description: 'Your account has been successfully created.',
        duration: 3000,
      });
      form.reset();
      setIsAddAccountOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error creating account',
        description: error.message || 'An error occurred creating your account.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormValues }) => {
      return apiRequest(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          balance: data.balance
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: 'Account updated',
        description: 'Your account has been successfully updated.',
        duration: 3000,
      });
      form.reset();
      setIsAddAccountOpen(false);
      setSelectedAccount(null);
    },
    onError: (error) => {
      toast({
        title: 'Error updating account',
        description: error.message || 'An error occurred updating your account.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/accounts/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: 'Account deleted',
        description: 'Your account has been successfully deleted.',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting account',
        description: error.message || 'An error occurred deleting your account.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  const openAddAccountModal = () => {
    form.reset();
    setSelectedAccount(null);
    setIsAddAccountOpen(true);
  };

  const openEditAccountModal = (account: Account) => {
    form.reset({
      name: account.name,
      type: account.type,
      institution: account.institution,
      balance: account.balance.toString(),
      accountNumber: account.accountNumber
    });
    setSelectedAccount(account);
    setIsAddAccountOpen(true);
  };

  const handleDeleteAccount = (id: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteAccountMutation.mutate(id);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ id: selectedAccount.id, data: values });
    } else {
      createAccountMutation.mutate(values);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <>
      <Header 
        title="Accounts" 
        subtitle="Manage your bank, credit card, and investment accounts"
      />

      <div className="px-4 pb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <ConnectBankModal 
              trigger={
                <Button className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Connect Bank
                </Button>
              }
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
                toast({
                  title: 'Bank Connected',
                  description: 'Your bank account has been successfully connected.',
                });
              }}
            />
          </div>
          <Button onClick={openAddAccountModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Account Manually
          </Button>
        </div>
        
        <ConnectedAccounts />
        
        <div className="mt-8 mb-4">
          <h3 className="text-lg font-medium">All Accounts</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="p-6 animate-pulse">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="ml-3">
                        <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-6 w-36 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-100 rounded"></div>
                </div>
              </Card>
            ))
          ) : accounts && accounts.length > 0 ? (
            accounts.map((account) => (
              <Card key={account.id} className="p-6 border-t-4" style={{ borderTopColor: account.type.toLowerCase() === 'credit' ? '#F44336' : '#2E7D32' }}>
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className={`h-12 w-12 rounded-full border-2 ${getAccountColor(account.type)} flex items-center justify-center`}>
                        {getAccountIcon(account.type)}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">{account.name}</h4>
                        <p className="text-sm text-gray-500">{account.institution}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditAccountModal(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className={`text-2xl font-bold ${Number(account.balance) >= 0 ? 'text-text' : 'text-alert'}`}>
                      {formatCurrency(Number(account.balance))}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Account: ••••{account.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">No Accounts Found</h3>
                <p className="text-gray-500 mb-6">Add your first account to start tracking your finances</p>
                <Button onClick={openAddAccountModal}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Account
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chase Checking" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chase Bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number (last 4 digits)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234" maxLength={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsAddAccountOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedAccount ? 'Update Account' : 'Add Account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
