import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kycScoreService } from "@/services/kycScore.service";
import { toast } from "sonner";

// Query keys
export const kycScoreKeys = {
  all: ["kyc-score"] as const,
  myScore: () => [...kycScoreKeys.all, "my"] as const,
  mySummary: () => [...kycScoreKeys.all, "my-summary"] as const,
  userScore: (userId: number) => [...kycScoreKeys.all, "user", userId] as const,
  fraudFlags: (kycProfileId: number) =>
    [...kycScoreKeys.all, "fraud-flags", kycProfileId] as const,
  duplicates: (kycProfileId: number) =>
    [...kycScoreKeys.all, "duplicates", kycProfileId] as const,
};

// User hooks
export function useMyKycScore() {
  return useQuery({
    queryKey: kycScoreKeys.myScore(),
    queryFn: kycScoreService.getMyKycScore,
    retry: 1,
  });
}

export function useMyKycScoreSummary() {
  return useQuery({
    queryKey: kycScoreKeys.mySummary(),
    queryFn: kycScoreService.getMyKycScoreSummary,
    retry: 1,
  });
}

// Admin hooks
export function useKycScoreByUserId(userId: number) {
  return useQuery({
    queryKey: kycScoreKeys.userScore(userId),
    queryFn: () => kycScoreService.getKycScoreByUserId(userId),
    enabled: !!userId,
  });
}

export function useFraudFlags(kycProfileId: number) {
  return useQuery({
    queryKey: kycScoreKeys.fraudFlags(kycProfileId),
    queryFn: () => kycScoreService.getFraudFlags(kycProfileId),
    enabled: !!kycProfileId,
  });
}

export function useCheckDuplicates(kycProfileId: number) {
  return useQuery({
    queryKey: kycScoreKeys.duplicates(kycProfileId),
    queryFn: () => kycScoreService.checkDuplicates(kycProfileId),
    enabled: !!kycProfileId,
  });
}

// Mutation hooks
export function useCalculateKycScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kycProfileId: number) =>
      kycScoreService.calculateKycScore(kycProfileId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: kycScoreKeys.all });
      toast.success("KYC score calculated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to calculate KYC score"
      );
    },
  });
}

export function useScoreDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) =>
      kycScoreService.scoreDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycScoreKeys.all });
      toast.success("Document scored successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to score document");
    },
  });
}

export function useAdjustKycScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      kycProfileId,
      adjustment,
      reason,
    }: {
      kycProfileId: number;
      adjustment: number;
      reason: string;
    }) => kycScoreService.adjustScore(kycProfileId, adjustment, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycScoreKeys.all });
      toast.success("KYC score adjusted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to adjust KYC score"
      );
    },
  });
}

export function useResolveFraudFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      flagId,
      resolutionNote,
    }: {
      flagId: number;
      resolutionNote: string;
    }) => kycScoreService.resolveFraudFlag(flagId, resolutionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycScoreKeys.all });
      toast.success("Fraud flag resolved");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to resolve fraud flag"
      );
    },
  });
}

export function useRecalculateKycScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kycProfileId: number) =>
      kycScoreService.recalculateScore(kycProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycScoreKeys.all });
      toast.success("KYC score recalculated");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to recalculate KYC score"
      );
    },
  });
}
