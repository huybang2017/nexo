import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { setAuthTokens, clearAuthTokens } from '@/lib/api';
import type { LoginRequest, RegisterRequest } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      setAuthTokens(response.accessToken, response.refreshToken);
      queryClient.setQueryData(['currentUser'], response.user);
      toast.success('Login successful!');
      
      // Redirect based on role
      if (response.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      setAuthTokens(response.accessToken, response.refreshToken);
      queryClient.setQueryData(['currentUser'], response.user);
      toast.success('Registration successful!');
      
      // Redirect to dashboard (both BORROWER and LENDER)
      if (response.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem('refreshToken');
      return authService.logout(refreshToken || undefined);
    },
    onSuccess: () => {
      clearAuthTokens();
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onSettled: () => {
      clearAuthTokens();
      queryClient.clear();
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Failed to change password');
    },
  });
};

