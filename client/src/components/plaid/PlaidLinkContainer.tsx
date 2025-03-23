import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import PlaidLinkButton from './PlaidLinkButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PlaidLinkContainerProps {
  onSuccess?: () => void;
  isCompact?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

const PlaidLinkContainer = ({ 
  onSuccess, 
  isCompact = false,
  variant = 'default'
}: PlaidLinkContainerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  
  // Fetch link token
  const { data: linkTokenData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/plaid/create-link-token'],
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Exchange public token for access token
  const { mutate: exchangeToken, isPending: isExchanging } = useMutation({
    mutationFn: async (publicToken: string) => {
      return apiRequest('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Bank Connected',
        description: 'Your bank account has been successfully connected.',
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect your bank account. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (linkTokenData?.linkToken) {
      setLinkToken(linkTokenData.linkToken);
    }
  }, [linkTokenData]);

  const handlePlaidSuccess = (publicToken: string, metadata: any) => {
    exchangeToken(publicToken);
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-40" />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to initialize bank connection. 
          <button 
            onClick={() => refetch()} 
            className="ml-2 underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return linkToken ? (
    <PlaidLinkButton 
      linkToken={linkToken}
      onSuccess={handlePlaidSuccess}
      isCompact={isCompact}
      variant={variant}
    />
  ) : null;
};

export default PlaidLinkContainer;