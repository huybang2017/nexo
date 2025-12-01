import api from '@/lib/api';
import type {
  ApiResponse,
  PageResponse,
  User,
  Loan,
  KycProfile,
  Transaction,
  Ticket,
  AuditLog,
  SystemSetting,
  DashboardStats,
  UserRole,
  UserStatus,
  LoanStatus,
  LoanPurpose,
  KycStatus,
  TicketStatus,
  TicketPriority,
  LoanReviewRequest,
} from '@/types';

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  size?: number;
}

export interface AdminLoanFilters {
  search?: string;
  status?: LoanStatus;
  purpose?: LoanPurpose;
  page?: number;
  size?: number;
}

export interface KycFilters {
  status?: KycStatus;
  page?: number;
  size?: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  page?: number;
  size?: number;
}

export interface WithdrawalFilters {
  status?: TransactionStatus;
  page?: number;
  size?: number;
}

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  entityType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface SystemSettingRequest {
  settingKey: string;
  settingValue: string;
  settingType: string;
  description?: string;
  category?: string;
  isEditable: boolean;
}

export interface UpdateSystemSettingRequest {
  settingValue: string;
  description?: string;
}

export interface KycReviewRequest {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}

export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return response.data.data;
  },

  // Users
  async getUsers(filters?: UserFilters): Promise<PageResponse<User>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<User>>>(`/admin/users?${params}`);
    return response.data.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data.data;
  },

  async updateUserStatus(id: number, status: UserStatus): Promise<void> {
    await api.put(`/admin/users/${id}/status`, { status });
  },

  async banUser(id: number, reason: string): Promise<void> {
    await api.post(`/admin/users/${id}/ban`, { reason });
  },

  async unbanUser(id: number): Promise<void> {
    await api.post(`/admin/users/${id}/unban`);
  },

  // Loans
  async getLoans(filters?: AdminLoanFilters): Promise<PageResponse<Loan>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Loan>>>(`/admin/loans?${params}`);
    return response.data.data;
  },

  async getLoanById(id: number): Promise<Loan> {
    const response = await api.get<ApiResponse<Loan>>(`/admin/loans/${id}`);
    return response.data.data;
  },

  async reviewLoan(id: number, data: LoanReviewRequest): Promise<Loan> {
    const response = await api.post<ApiResponse<Loan>>(`/admin/loans/${id}/review`, data);
    return response.data.data;
  },

  // KYC
  async getKycProfiles(filters?: KycFilters): Promise<PageResponse<KycProfile>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<KycProfile>>>(`/admin/kyc?${params}`);
    return response.data.data;
  },

  async getKycProfileById(id: number): Promise<KycProfile> {
    const response = await api.get<ApiResponse<KycProfile>>(`/admin/kyc/${id}`);
    return response.data.data;
  },

  async reviewKyc(id: number, data: KycReviewRequest): Promise<KycProfile> {
    const response = await api.post<ApiResponse<KycProfile>>(`/admin/kyc/${id}/review`, data);
    return response.data.data;
  },

  // Withdrawals
  async getWithdrawals(filters?: WithdrawalFilters): Promise<PageResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Transaction>>>(`/admin/withdrawals?${params}`);
    return response.data.data;
  },

  async approveWithdrawal(transactionId: number): Promise<void> {
    await api.post(`/admin/withdrawals/${transactionId}/approve`);
  },

  async rejectWithdrawal(transactionId: number, reason: string): Promise<void> {
    await api.post(`/admin/withdrawals/${transactionId}/reject?reason=${encodeURIComponent(reason)}`);
  },

  // Tickets
  async getTickets(filters?: TicketFilters): Promise<PageResponse<Ticket>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Ticket>>>(`/tickets/admin?${params}`);
    return response.data.data;
  },

  async getTicketById(id: number): Promise<Ticket> {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return response.data.data;
  },

  async updateTicketStatus(id: number, status: TicketStatus): Promise<void> {
    await api.put(`/tickets/admin/${id}/status?status=${status}`);
  },

  async updateTicketPriority(id: number, priority: TicketPriority): Promise<void> {
    await api.put(`/tickets/admin/${id}/priority?priority=${priority}`);
  },

  async assignTicket(id: number, staffId: number): Promise<void> {
    await api.put(`/tickets/admin/${id}/assign?staffId=${staffId}`);
  },

  // System Settings
  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    const response = await api.get<ApiResponse<SystemSetting[]>>(`/admin/settings?${params}`);
    return response.data.data;
  },

  async getSystemSettingById(id: number): Promise<SystemSetting> {
    const response = await api.get<ApiResponse<SystemSetting>>(`/admin/settings/${id}`);
    return response.data.data;
  },

  async getSystemSettingByKey(key: string): Promise<SystemSetting> {
    const response = await api.get<ApiResponse<SystemSetting>>(`/admin/settings/key/${key}`);
    return response.data.data;
  },

  async createSystemSetting(data: SystemSettingRequest): Promise<SystemSetting> {
    const response = await api.post<ApiResponse<SystemSetting>>('/admin/settings', data);
    return response.data.data;
  },

  async updateSystemSetting(id: number, data: UpdateSystemSettingRequest): Promise<SystemSetting> {
    const response = await api.put<ApiResponse<SystemSetting>>(`/admin/settings/${id}`, data);
    return response.data.data;
  },

  async updateSystemSettingByKey(key: string, data: UpdateSystemSettingRequest): Promise<SystemSetting> {
    const response = await api.put<ApiResponse<SystemSetting>>(`/admin/settings/key/${key}`, data);
    return response.data.data;
  },

  async deleteSystemSetting(id: number): Promise<void> {
    await api.delete(`/admin/settings/${id}`);
  },

  // Audit Logs
  async getAuditLogs(filters?: AuditLogFilters): Promise<PageResponse<AuditLog>> {
    const params = new URLSearchParams();
    if (filters?.userId !== undefined) params.append('userId', String(filters.userId));
    if (filters?.action) params.append('action', filters.action);
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<AuditLog>>>(`/admin/audit-logs?${params}`);
    return response.data.data;
  },
};

export default adminService;

