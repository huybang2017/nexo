import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kycService, KycSubmitRequest } from "@/services/kyc.service";
import { toast } from "sonner";

export const useMyKyc = () => {
  return useQuery({
    queryKey: ["myKyc"],
    queryFn: () => kycService.getMyKyc(),
  });
};

export const useSubmitKyc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: KycSubmitRequest) => kycService.submitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myKyc"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit KYC");
    },
  });
};

export const useUploadKycDocument = () => {
  return useMutation({
    mutationFn: ({
      file,
      documentType,
    }: {
      file: File;
      documentType: "ID_CARD_FRONT" | "ID_CARD_BACK" | "SELFIE";
    }) => kycService.uploadDocument(file, documentType),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload document");
    },
  });
};
