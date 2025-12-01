import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentService, InvestmentFilters } from '@/services/investment.service';
import type { InvestRequest } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useMyInvestments = (filters?: InvestmentFilters) => {
  return useQuery({
    queryKey: ['myInvestments', filters],
    queryFn: () => investmentService.getMyInvestments(filters),
  });
};

export const useInvestment = (id: number) => {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: () => investmentService.getInvestmentById(id),
    enabled: !!id,
  });
};

export const usePortfolio = () => {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: investmentService.getPortfolio,
  });
};

export const useCreateInvestment = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: InvestRequest) => investmentService.createInvestment(data),
    onSuccess: (investment) => {
      // Invalidate queries first
      queryClient.invalidateQueries({ queryKey: ['myInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceLoans'] });
      
      // Refetch immediately to ensure fresh data when navigating
      queryClient.refetchQueries({ queryKey: ['myInvestments'] });
      queryClient.refetchQueries({ queryKey: ['portfolio'] });
      queryClient.refetchQueries({ queryKey: ['wallet'] });
      queryClient.refetchQueries({ queryKey: ['transactions'] });
      
      toast.success('Investment successful!');
      navigate(`/dashboard/portfolio`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message || 'Investment failed';
      
      // Check if error is about KYC approval
      if (errorMessage.toLowerCase().includes('kyc') && errorMessage.toLowerCase().includes('approved')) {
        toast.error('Please complete KYC verification to invest');
        navigate('/dashboard/kyc');
      } else {
        toast.error(errorMessage);
      }
    },
  });
};

