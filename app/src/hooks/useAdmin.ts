import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, UserFilters, AdminLoanFilters, KycFilters, TicketFilters, KycReviewRequest, WithdrawalFilters, AuditLogFilters, SystemSettingRequest, UpdateSystemSettingRequest } from '@/services/admin.service';
import type { LoanReviewRequest, UserStatus, TransactionStatus, TicketStatus, TicketPriority } from '@/types';
import { toast } from 'sonner';

// Dashboard
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  });
};

// Users
export const useAdminUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: ['adminUsers', filters],
    queryFn: () => adminService.getUsers(filters),
  });
};

export const useAdminUser = (id: number) => {
  return useQuery({
    queryKey: ['adminUser', id],
    queryFn: () => adminService.getUserById(id),
    enabled: !!id,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) =>
      adminService.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser'] });
      toast.success('User status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser'] });
      toast.success('User banned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to ban user');
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser'] });
      toast.success('User unbanned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unban user');
    },
  });
};

// Loans
export const useAdminLoans = (filters?: AdminLoanFilters) => {
  return useQuery({
    queryKey: ['adminLoans', filters],
    queryFn: () => adminService.getLoans(filters),
  });
};

export const useAdminLoan = (id: number) => {
  return useQuery({
    queryKey: ['adminLoan', id],
    queryFn: () => adminService.getLoanById(id),
    enabled: !!id,
  });
};

export const useReviewLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LoanReviewRequest }) =>
      adminService.reviewLoan(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLoans'] });
      queryClient.invalidateQueries({ queryKey: ['adminLoan', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Loan reviewed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to review loan');
    },
  });
};

// KYC
export const useAdminKyc = (filters?: KycFilters) => {
  return useQuery({
    queryKey: ['adminKyc', filters],
    queryFn: () => adminService.getKycProfiles(filters),
  });
};

export const useAdminKycDetail = (id: number) => {
  return useQuery({
    queryKey: ['adminKycDetail', id],
    queryFn: () => adminService.getKycProfileById(id),
    enabled: !!id,
  });
};

export const useReviewKyc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: KycReviewRequest }) =>
      adminService.reviewKyc(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminKyc'] });
      queryClient.invalidateQueries({ queryKey: ['adminKycDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      // Don't show toast on success - silent approval
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to review KYC');
    },
  });
};

// Withdrawals
export const useAdminWithdrawals = (filters?: WithdrawalFilters) => {
  return useQuery({
    queryKey: ['adminWithdrawals', filters],
    queryFn: () => adminService.getWithdrawals(filters),
  });
};

export const useApproveWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: number) => adminService.approveWithdrawal(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Withdrawal approved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve withdrawal');
    },
  });
};

export const useRejectWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: number; reason: string }) =>
      adminService.rejectWithdrawal(transactionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Withdrawal rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject withdrawal');
    },
  });
};

// Tickets
export const useAdminTickets = (filters?: TicketFilters) => {
  return useQuery({
    queryKey: ['adminTickets', filters],
    queryFn: () => adminService.getTickets(filters),
  });
};

export const useAdminTicket = (id: number) => {
  return useQuery({
    queryKey: ['adminTicket', id],
    queryFn: () => adminService.getTicketById(id),
    enabled: !!id,
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) =>
      adminService.updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminTicket'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Ticket status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update ticket status');
    },
  });
};

export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: number; priority: TicketPriority }) =>
      adminService.updateTicketPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminTicket'] });
      toast.success('Ticket priority updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update ticket priority');
    },
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, staffId }: { id: number; staffId: number }) =>
      adminService.assignTicket(id, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminTicket'] });
      toast.success('Ticket assigned');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign ticket');
    },
  });
};

// Audit Logs
export const useAdminAuditLogs = (filters?: AuditLogFilters) => {
  return useQuery({
    queryKey: ['adminAuditLogs', filters],
    queryFn: () => adminService.getAuditLogs(filters),
  });
};

// System Settings
export const useSystemSettings = (category?: string) => {
  return useQuery({
    queryKey: ['systemSettings', category],
    queryFn: () => adminService.getSystemSettings(category),
  });
};

export const useSystemSetting = (id: number) => {
  return useQuery({
    queryKey: ['systemSetting', id],
    queryFn: () => adminService.getSystemSettingById(id),
    enabled: !!id,
  });
};

export const useSystemSettingByKey = (key: string) => {
  return useQuery({
    queryKey: ['systemSettingByKey', key],
    queryFn: () => adminService.getSystemSettingByKey(key),
    enabled: !!key,
  });
};

export const useCreateSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SystemSettingRequest) => adminService.createSystemSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('System setting created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create system setting');
    },
  });
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSystemSettingRequest }) =>
      adminService.updateSystemSetting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['systemSetting'] });
      toast.success('System setting updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update system setting');
    },
  });
};

export const useUpdateSystemSettingByKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateSystemSettingRequest }) =>
      adminService.updateSystemSettingByKey(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['systemSettingByKey'] });
      toast.success('System setting updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update system setting');
    },
  });
};

export const useDeleteSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.deleteSystemSetting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('System setting deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete system setting');
    },
  });
};

