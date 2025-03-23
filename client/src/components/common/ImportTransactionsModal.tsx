import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { UploadIcon, AlertCircleIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Account } from '@shared/schema';

type ImportTransactionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const formSchema = z.object({
  accountId: z.string().min(1, 'Please select an account'),
  file: z.instanceof(FileList).refine(files => files.length === 1, 'Please upload a CSV file')
});

type FormValues = z.infer<typeof formSchema>;

export default function ImportTransactionsModal({ isOpen, onClose }: ImportTransactionsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: '',
    }
  });

  const importMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest('/api/transactions/import', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics/dashboard'] });
      toast({
        title: 'Transactions imported',
        description: 'Your transactions have been successfully imported.',
        duration: 3000,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred while importing your transactions.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('accountId', values.accountId);
      formData.append('file', values.file[0]);
      
      await importMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import your transactions. Make sure it includes date, description, amount, category, and merchant columns.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts && accounts.length > 0 ? (
                        accounts.map(account => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No accounts available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Upload CSV File</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <Input
                        {...field}
                        type="file"
                        accept=".csv"
                        onChange={(e) => onChange(e.target.files)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="w-full cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                          <UploadIcon className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            {value && value.length > 0 
                              ? value[0].name 
                              : 'Click to upload or drag and drop a CSV file'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start p-3 bg-yellow-50 rounded-md">
              <AlertCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Expected CSV format: date, description, amount, category, merchant. Negative values for expenses, positive for income.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" type="button" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || accounts?.length === 0}>
                {isUploading ? 'Importing...' : 'Import Transactions'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
