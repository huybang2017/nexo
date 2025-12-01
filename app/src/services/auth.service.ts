import api from '@/lib/api';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, TokenResponse, User } from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
      return response.data.data;
    } catch (error: any) {
      // Re-throw with better error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Invalid email or password';
      const customError = new Error(errorMessage);
      (customError as any).response = error?.response;
      throw customError;
    }
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<ApiResponse<TokenResponse>>('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  getGoogleLoginUrl(): string {
    return `${(import.meta.env?.VITE_API_URL as string) || 'http://localhost:8080'}/oauth2/authorization/google`;
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
    await api.post('/users/me/password', data);
  },
};

export default authService;

