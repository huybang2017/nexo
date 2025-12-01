import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export const passwordService = {
  async forgotPassword(email: string): Promise<void> {
    await api.post<ApiResponse<void>>('/password/forgot', { email });
  },

  async validateResetToken(token: string): Promise<boolean> {
    const response = await api.get<ApiResponse<boolean>>('/password/reset/validate', {
      params: { token },
    });
    return response.data.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post<ApiResponse<void>>('/password/reset', { token, newPassword });
  },
};

export const emailService = {
  async verifyEmail(token: string): Promise<void> {
    await api.post<ApiResponse<void>>('/email/verify', null, {
      params: { token },
    });
  },

  async resendVerificationEmail(): Promise<void> {
    await api.post<ApiResponse<void>>('/email/resend');
  },
};

export default { passwordService, emailService };

