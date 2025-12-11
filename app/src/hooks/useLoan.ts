import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  loanService,
  LoanFilters,
  MarketplaceFilters,
} from "@/services/loan.service";
import type { CreateLoanRequest } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Re-export filter types for convenience
export type { LoanFilters, MarketplaceFilters };

// Borrower hooks
export const useMyLoans = (filters?: LoanFilters) => {
  return useQuery({
    queryKey: ["myLoans", filters],
    queryFn: () => loanService.getMyLoans(filters),
  });
};

export const useLoan = (id: number) => {
  return useQuery({
    queryKey: ["loan", id],
    queryFn: () => loanService.getLoanById(id),
    enabled: !!id,
  });
};

export const useLoanByCode = (code: string) => {
  return useQuery({
    queryKey: ["loan", "code", code],
    queryFn: () => loanService.getLoanByCode(code),
    enabled: !!code,
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateLoanRequest) => loanService.createLoan(data),
    onSuccess: (loan) => {
      queryClient.invalidateQueries({ queryKey: ["myLoans"] });
      toast.success("Loan request submitted successfully!");
      navigate(`/dashboard/loans/${loan.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create loan");
    },
  });
};

export const useCancelLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => loanService.cancelLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLoans"] });
      queryClient.invalidateQueries({ queryKey: ["loan"] });
      toast.success("Loan cancelled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel loan");
    },
  });
};

export const useRepaymentSchedule = (loanId: number) => {
  return useQuery({
    queryKey: ["repaymentSchedule", loanId],
    queryFn: () => loanService.getRepaymentSchedule(loanId),
    enabled: !!loanId,
  });
};

// Lender hooks (Marketplace)
export const useMarketplaceLoans = (filters?: MarketplaceFilters) => {
  return useQuery({
    queryKey: ["marketplaceLoans", filters],
    queryFn: () => loanService.getMarketplaceLoans(filters),
  });
};

export const useMarketplaceLoansInfinite = (
  filters?: Omit<MarketplaceFilters, "page">
) => {
  return useInfiniteQuery({
    queryKey: ["marketplaceLoansInfinite", filters],
    queryFn: ({ pageParam = 0 }) =>
      loanService.getMarketplaceLoans({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.page + 1,
    initialPageParam: 0,
  });
};

export const useMarketplaceLoanDetail = (id: number) => {
  return useQuery({
    queryKey: ["marketplaceLoan", id],
    queryFn: () => loanService.getMarketplaceLoanDetail(id),
    enabled: !!id,
  });
};

// Loan Documents
export const useLoanDocuments = (loanId: number) => {
  return useQuery({
    queryKey: ["loanDocuments", loanId],
    queryFn: () => loanService.getLoanDocuments(loanId),
    enabled: !!loanId,
  });
};

export const useUploadLoanDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      loanId,
      file,
      documentType,
      description,
    }: {
      loanId: number;
      file: File;
      documentType: string;
      description?: string;
    }) =>
      loanService.uploadLoanDocument(loanId, file, documentType, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["loanDocuments", variables.loanId],
      });
      queryClient.invalidateQueries({ queryKey: ["loan", variables.loanId] });
      toast.success("Document uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload document");
    },
  });
};

export const useDeleteLoanDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) =>
      loanService.deleteLoanDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["loan"] });
      toast.success("Document deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });
};
