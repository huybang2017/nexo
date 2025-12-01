import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService, TransactionFilters } from '@/services/wallet.service';
import type { DepositRequest, WithdrawRequest } from '@/types';
import { toast } from 'sonner';

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: walletService.getWallet,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', filters?.type, filters?.status, filters?.from, filters?.to, filters?.page, filters?.size],
    queryFn: () => walletService.getTransactions(filters),
    enabled: true,
  });
};

export const useTransaction = (id: number | null) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => walletService.getTransactionById(id!),
    enabled: !!id,
  });
};

export const useDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepositRequest) => walletService.requestDeposit(data),
    onSuccess: (response) => {
      // Invalidate queries so they refetch after payment
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Open payment URL in new window/tab
      window.open(response.paymentUrl, '_blank');
      toast.success('Redirecting to payment...');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create deposit');
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawRequest) => walletService.requestWithdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Withdrawal request submitted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Withdrawal request failed');
    },
  });
};

