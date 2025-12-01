import api from '@/lib/api';
import type { 
  ApiResponse, 
  PageResponse, 
  CreditScore, 
  CreditScoreSummary, 
  CreditScoreHistory,
  AdminAdjustScoreRequest 
} from '@/types';

export const creditScoreService = {
  // ==================== USER ENDPOINTS ====================

  /**
   * Get current user's credit score
   */
  async getMyCreditScore(): Promise<CreditScore> {
    const response = await api.get<ApiResponse<CreditScore>>('/credit-score/me');
    return response.data.data;
  },

  /**
   * Get current user's credit score summary
   */
  async getMyCreditScoreSummary(): Promise<CreditScoreSummary> {
    const response = await api.get<ApiResponse<CreditScoreSummary>>('/credit-score/me/summary');
    return response.data.data;
  },

  /**
   * Get current user's credit score history
   */
  async getMyCreditScoreHistory(page = 0, size = 20): Promise<PageResponse<CreditScoreHistory>> {
    const response = await api.get<ApiResponse<PageResponse<CreditScoreHistory>>>(
      '/credit-score/me/history',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /**
   * Request credit score recalculation
   */
  async recalculateMyScore(): Promise<CreditScore> {
    const response = await api.post<ApiResponse<CreditScore>>('/credit-score/me/recalculate');
    return response.data.data;
  },

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get user's credit score (Admin)
   */
  async getUserCreditScore(userId: number): Promise<CreditScore> {
    const response = await api.get<ApiResponse<CreditScore>>(`/credit-score/admin/user/${userId}`);
    return response.data.data;
  },

  /**
   * Get user's credit score history (Admin)
   */
  async getUserCreditScoreHistory(
    userId: number, 
    page = 0, 
    size = 20
  ): Promise<PageResponse<CreditScoreHistory>> {
    const response = await api.get<ApiResponse<PageResponse<CreditScoreHistory>>>(
      `/credit-score/admin/user/${userId}/history`,
      { params: { page, size } }
    );
    return response.data.data;
  },

  /**
   * Manually adjust user's credit score (Admin)
   */
  async adjustUserCreditScore(userId: number, request: AdminAdjustScoreRequest): Promise<CreditScore> {
    const response = await api.post<ApiResponse<CreditScore>>(
      `/credit-score/admin/user/${userId}/adjust`,
      request
    );
    return response.data.data;
  },

  /**
   * Force recalculate user's credit score (Admin)
   */
  async forceRecalculateUserScore(userId: number): Promise<CreditScore> {
    const response = await api.post<ApiResponse<CreditScore>>(
      `/credit-score/admin/user/${userId}/recalculate`
    );
    return response.data.data;
  }
};

