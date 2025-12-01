import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditScoreService } from '@/services/creditScore.service';
import type { AdminAdjustScoreRequest } from '@/types';
import { toast } from 'sonner';

// ==================== USER HOOKS ====================

export function useMyCreditScore() {
  return useQuery({
    queryKey: ['creditScore', 'me'],
    queryFn: () => creditScoreService.getMyCreditScore(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMyCreditScoreSummary() {
  return useQuery({
    queryKey: ['creditScore', 'me', 'summary'],
    queryFn: () => creditScoreService.getMyCreditScoreSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyCreditScoreHistory(page = 0, size = 20) {
  return useQuery({
    queryKey: ['creditScore', 'me', 'history', page, size],
    queryFn: () => creditScoreService.getMyCreditScoreHistory(page, size),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecalculateMyCreditScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => creditScoreService.recalculateMyScore(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditScore', 'me'] });
      toast.success('Credit score recalculated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to recalculate credit score');
    },
  });
}

// ==================== ADMIN HOOKS ====================

export function useUserCreditScore(userId: number) {
  return useQuery({
    queryKey: ['creditScore', 'admin', 'user', userId],
    queryFn: () => creditScoreService.getUserCreditScore(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserCreditScoreHistory(userId: number, page = 0, size = 20) {
  return useQuery({
    queryKey: ['creditScore', 'admin', 'user', userId, 'history', page, size],
    queryFn: () => creditScoreService.getUserCreditScoreHistory(userId, page, size),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdjustUserCreditScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, request }: { userId: number; request: AdminAdjustScoreRequest }) =>
      creditScoreService.adjustUserCreditScore(userId, request),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['creditScore', 'admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Credit score adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to adjust credit score');
    },
  });
}

export function useForceRecalculateUserScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => creditScoreService.forceRecalculateUserScore(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['creditScore', 'admin', 'user', userId] });
      toast.success('Credit score recalculated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to recalculate credit score');
    },
  });
}

