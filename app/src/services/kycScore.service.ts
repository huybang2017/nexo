import api from '@/lib/api';
import type { 
  KycScore, 
  KycScoreSummary, 
  KycDocumentScore, 
  KycFraudFlag,
  DuplicateCheckResult 
} from '@/types';

export const kycScoreService = {
  // User endpoints
  getMyKycScore: async (): Promise<KycScore> => {
    const response = await api.get('/kyc-score/me');
    return response.data;
  },

  getMyKycScoreSummary: async (): Promise<KycScoreSummary> => {
    const response = await api.get('/kyc-score/me/summary');
    return response.data;
  },

  // Admin endpoints
  calculateKycScore: async (kycProfileId: number): Promise<KycScore> => {
    const response = await api.post(`/kyc-score/admin/calculate/${kycProfileId}`);
    return response.data;
  },

  getKycScoreByUserId: async (userId: number): Promise<KycScore> => {
    const response = await api.get(`/kyc-score/admin/user/${userId}`);
    return response.data;
  },

  checkDuplicates: async (kycProfileId: number): Promise<DuplicateCheckResult> => {
    const response = await api.get(`/kyc-score/admin/check-duplicates/${kycProfileId}`);
    return response.data;
  },

  scoreDocument: async (documentId: number): Promise<KycDocumentScore> => {
    const response = await api.post(`/kyc-score/admin/document/${documentId}/score`);
    return response.data;
  },

  getFraudFlags: async (kycProfileId: number): Promise<KycFraudFlag[]> => {
    const response = await api.get(`/kyc-score/admin/fraud-flags/${kycProfileId}`);
    return response.data;
  },

  adjustScore: async (kycProfileId: number, adjustment: number, reason: string): Promise<KycScore> => {
    const response = await api.post(`/kyc-score/admin/adjust/${kycProfileId}`, {
      adjustment,
      reason
    });
    return response.data;
  },

  resolveFraudFlag: async (flagId: number, resolutionNote: string): Promise<void> => {
    await api.post(`/kyc-score/admin/fraud-flags/${flagId}/resolve`, {
      resolutionNote
    });
  },

  recalculateScore: async (kycProfileId: number): Promise<KycScore> => {
    const response = await api.post(`/kyc-score/admin/recalculate/${kycProfileId}`);
    return response.data;
  }
};

export default kycScoreService;


