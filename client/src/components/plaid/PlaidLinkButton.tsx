import React from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type PlaidLinkButtonProps = {
  linkToken: string;
  onSuccess?: (publicToken: string, metadata: any) => void;
  onExit?: () => void;
  isCompact?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
};

const PlaidLinkButton = ({ 
  linkToken, 
  onSuccess, 
  onExit,
  isCompact = false,
  variant = 'default'
}: PlaidLinkButtonProps) => {
  const { toast } = useToast();

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      if (onSuccess) {
        onSuccess(public_token, metadata);
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link Error:', err);
        toast({
          title: 'Connection Error',
          description: 'There was a problem connecting to your bank. Please try again.',
          variant: 'destructive',
        });
      }
      if (onExit) onExit();
    },
    onEvent: (eventName, metadata) => {
      console.log('Plaid Link Event:', eventName, metadata);
    },
  });

  const handleClick = () => {
    if (ready) {
      open();
    } else {
      toast({
        title: 'Link is not ready',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!ready}
      variant={variant}
      className={isCompact ? 'px-3 h-9 text-sm' : ''}
    >
      {isCompact ? 'Connect Bank' : 'Connect Your Bank Account'}
    </Button>
  );
};

export default PlaidLinkButton;